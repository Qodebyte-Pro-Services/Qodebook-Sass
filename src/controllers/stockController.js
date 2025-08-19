

const pool = require('../config/db');
const AuditService = require('../services/auditService');
const StockNotificationService = require('../services/stockNotificationService');



exports.transferStock = async (req, res) => {
  try {
    const { 
      variant_id, 
      from_branch_id, 
      to_branch_id, 
      quantity, 
      reason, 
      expected_delivery_date,
      transfer_notes 
    } = req.body;

    if (!variant_id || !from_branch_id || !to_branch_id || !quantity || !reason) {
      return res.status(400).json({ 
        message: 'variant_id, from_branch_id, to_branch_id, quantity, and reason are required.' 
      });
    }

    if (from_branch_id === to_branch_id) {
      return res.status(400).json({ message: 'Source and destination branches cannot be the same.' });
    }

 
    const sourceVariant = await pool.query(
      'SELECT * FROM variants WHERE id = $1 AND branch_id = $2',
      [variant_id, from_branch_id]
    );

    if (sourceVariant.rows.length === 0) {
      return res.status(404).json({ message: 'Variant not found in source branch.' });
    }

    if (sourceVariant.rows[0].quantity < quantity) {
      return res.status(400).json({ message: 'Insufficient stock in source branch.' });
    }

  
    const transferResult = await pool.query(`
      INSERT INTO stock_transfers (
        variant_id, from_branch_id, to_branch_id, quantity, 
        reason, expected_delivery_date, transfer_notes, status, 
        initiated_by, business_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending', $8, $9) 
      RETURNING *
    `, [
      variant_id, from_branch_id, to_branch_id, quantity, 
      reason, expected_delivery_date, transfer_notes, 
      req.user?.staff_id || req.user?.id, req.user?.business_id
    ]);

    const transfer = transferResult.rows[0];

 
  const recorded_by = req.user?.staff_id || req.user?.user_id;
const recorded_by_type = req.user?.staff_id ? 'staff' : 'user';

await pool.query(`
  INSERT INTO inventory_logs (
    variant_id, type, quantity, note, branch_id, 
    related_transfer_id, business_id, recorded_by, recorded_by_type
  ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
`, [
  variant_id, 'transfer_out', -quantity, 
  `Transfer to branch ${to_branch_id}: ${reason}`, 
  from_branch_id, transfer.id, req.user?.business_id,
  recorded_by, recorded_by_type
]);



    await AuditService.logStockAction('transfer_initiated', variant_id, req.user?.business_id, req.user, {
      transfer_id: transfer.id,
      from_branch: from_branch_id,
      to_branch: to_branch_id,
      quantity,
      reason
    }, req);

 
    await StockNotificationService.createTransferNotification(transfer.id, req.user?.business_id);

    return res.status(201).json({ 
      message: 'Stock transfer initiated.', 
      transfer,
      remaining_stock: sourceVariant.rows[0].quantity - quantity
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};


exports.completeTransfer = async (req, res) => {
  try {
    const { transfer_id } = req.params;
    const { actual_quantity, received_notes } = req.body;

    const transferResult = await pool.query(`
      SELECT * FROM stock_transfers 
      WHERE id = $1 AND business_id = $2 AND status = 'pending'
    `, [transfer_id, req.user?.business_id]);

    if (transferResult.rows.length === 0) {
      return res.status(404).json({ message: 'Transfer not found or already completed.' });
    }

    const transfer = transferResult.rows[0];
    const quantity = actual_quantity || transfer.quantity;


    let destVariant = await pool.query(
      'SELECT * FROM variants WHERE product_id = (SELECT product_id FROM variants WHERE id = $1) AND branch_id = $2',
      [transfer.variant_id, transfer.to_branch_id]
    );

    if (destVariant.rows.length === 0) {
    
      const sourceVariant = await pool.query('SELECT * FROM variants WHERE id = $1', [transfer.variant_id]);
      const source = sourceVariant.rows[0];
      
      destVariant = await pool.query(`
        INSERT INTO variants (
          product_id, branch_id, sku, price, cost_price, 
          quantity, threshold, business_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *
      `, [
        source.product_id, transfer.to_branch_id, source.sku, 
        source.price, source.cost_price, 0, source.threshold, req.user?.business_id
      ]);
    }

    const destVariantId = destVariant.rows[0].id;

   
    await pool.query(
      'UPDATE variants SET quantity = quantity - $1 WHERE id = $2',
      [quantity, transfer.variant_id]
    );

    await pool.query(
      'UPDATE variants SET quantity = quantity + $1 WHERE id = $2',
      [quantity, destVariantId]
    );

  
    await pool.query(`
      UPDATE stock_transfers SET 
        status = 'completed', 
        actual_quantity = $1, 
        received_notes = $2,
        completed_at = NOW(),
        completed_by = $3
      WHERE id = $4
    `, [quantity, received_notes, req.user?.staff_id || req.user?.id, transfer_id]);

    const recorded_by = req.user?.staff_id || req.user?.user_id;
const recorded_by_type = req.user?.staff_id ? 'staff' : 'user';
   
    await pool.query(`
      INSERT INTO inventory_logs (
        variant_id, type, quantity, note, branch_id, 
        related_transfer_id, business_id,  recorded_by, recorded_by_type
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `, [
      destVariantId, 'transfer_in', quantity, 
      `Transfer from branch ${transfer.from_branch_id}: ${transfer.reason}`, 
      transfer.to_branch_id, transfer_id, req.user?.business_id,
      recorded_by, recorded_by_type
    ]);


    await AuditService.logStockAction('transfer_completed', destVariantId, req.user?.business_id, req.user, {
      transfer_id: transfer.id,
      from_branch: transfer.from_branch_id,
      to_branch: transfer.to_branch_id,
      quantity,
      received_notes
    }, req);

    return res.status(200).json({ 
      message: 'Stock transfer completed successfully.',
      transfer_id,
      quantity_transferred: quantity
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

exports.getPendingTransfers = async (req, res) => {
  try {
    const { branch_id } = req.query;
    let query = `
      SELECT st.*, 
             v.sku, v.name as variant_name,
             p.name as product_name,
             fb.name as from_branch_name,
             tb.name as to_branch_name,
             s.full_name as initiated_by_name
      FROM stock_transfers st
      JOIN variants v ON st.variant_id = v.id
      JOIN products p ON v.product_id = p.id
      JOIN branches fb ON st.from_branch_id = fb.id
      JOIN branches tb ON st.to_branch_id = tb.id
      LEFT JOIN staff s ON st.initiated_by = s.staff_id
      WHERE st.business_id = $1 AND st.status = 'pending'
    `;
    let params = [req.user?.business_id];

    if (branch_id) {
      query += ' AND (st.from_branch_id = $2 OR st.to_branch_id = $2)';
      params.push(branch_id);
    }

    query += ' ORDER BY st.created_at DESC';

    const result = await pool.query(query, params);
    return res.status(200).json({ transfers: result.rows });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};




exports.getStockHistory = async (req, res) => {
  try {
    const { 
      variant_id, 
      branch_id, 
      type, 
      start_date, 
      end_date,
      limit = 50,
      offset = 0 
    } = req.query;

    let query = `
      SELECT il.*, 
             v.sku, v.name as variant_name,
             p.name as product_name,
             b.name as branch_name,
             s.full_name as adjusted_by_name
      FROM inventory_logs il
      JOIN variants v ON il.variant_id = v.id
      JOIN products p ON v.product_id = p.id
      LEFT JOIN branches b ON il.branch_id = b.id
      LEFT JOIN staff s ON il.adjusted_by = s.staff_id
      WHERE il.business_id = $1
    `;
    let params = [req.user?.business_id];
    let paramCount = 1;

    if (variant_id) {
      paramCount++;
      query += ` AND il.variant_id = $${paramCount}`;
      params.push(variant_id);
    }

    if (branch_id) {
      paramCount++;
      query += ` AND il.branch_id = $${paramCount}`;
      params.push(branch_id);
    }

    if (type) {
      paramCount++;
      query += ` AND il.type = $${paramCount}`;
      params.push(type);
    }

    if (start_date) {
      paramCount++;
      query += ` AND il.created_at >= $${paramCount}`;
      params.push(start_date);
    }

    if (end_date) {
      paramCount++;
      query += ` AND il.created_at <= $${paramCount}`;
      params.push(end_date);
    }

    query += ` ORDER BY il.created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(parseInt(limit), parseInt(offset));

    const logs = await pool.query(query, params);
    return res.status(200).json({ 
      history: logs.rows,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: logs.rows.length
      }
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};


exports.getStockAnalytics = async (req, res) => {
  try {
    const { business_id } = req.user;
    const { period = '30' } = req.query;

   
    const movementsResult = await pool.query(`
      SELECT COUNT(*) as total_movements,
             COUNT(CASE WHEN type = 'restock' THEN 1 END) as restocks,
             COUNT(CASE WHEN type = 'sale' THEN 1 END) as sales,
             COUNT(CASE WHEN type = 'adjustment' THEN 1 END) as adjustments,
             COUNT(CASE WHEN type = 'transfer_in' OR type = 'transfer_out' THEN 1 END) as transfers
      FROM inventory_logs 
      WHERE business_id = $1 AND created_at >= NOW() - INTERVAL '${period} days'
    `, [business_id]);


    const topMovingResult = await pool.query(`
      SELECT v.id, v.sku, v.name, p.name as product_name,
             SUM(CASE WHEN il.type = 'sale' THEN ABS(il.quantity) ELSE 0 END) as total_sold,
             SUM(CASE WHEN il.type = 'restock' THEN il.quantity ELSE 0 END) as total_restocked
      FROM inventory_logs il
      JOIN variants v ON il.variant_id = v.id
      JOIN products p ON v.product_id = p.id
      WHERE il.business_id = $1 AND il.created_at >= NOW() - INTERVAL '${period} days'
      GROUP BY v.id, v.sku, v.name, p.name
      ORDER BY total_sold DESC
      LIMIT 10
    `, [business_id]);


    const branchStockResult = await pool.query(`
      SELECT b.name as branch_name,
             COUNT(v.id) as total_variants,
             SUM(v.quantity) as total_stock,
             COUNT(CASE WHEN v.quantity <= v.threshold THEN 1 END) as low_stock_items
      FROM variants v
      JOIN branches b ON v.branch_id = b.id
      WHERE v.business_id = $1
      GROUP BY b.id, b.name
      ORDER BY total_stock DESC
    `, [business_id]);

    return res.status(200).json({
      analytics: {
        period_days: parseInt(period),
        movements: movementsResult.rows[0],
        top_moving_products: topMovingResult.rows,
        branch_distribution: branchStockResult.rows
      }
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};


exports.getStockHistory = async (req, res) => {
  try {
    const { variant_id } = req.query;
    if (!variant_id) return res.status(400).json({ message: 'variant_id is required.' });
    const logs = await pool.query('SELECT * FROM inventory_logs WHERE variant_id = $1 ORDER BY created_at DESC', [variant_id]);
    return res.status(200).json({ history: logs.rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};




// exports.restockVariant = async (req, res) => {
//   try {
//     const { variants, expected_delivery_date, supply_order_date, supply_status = 'awaiting_payment', supplier_id } = req.body;
//     const business_id = req.business_id;
//     if (!business_id) return res.status(400).json({ message: 'business_id is required.' });

//     let variantList = [];
//     if (Array.isArray(variants)) {
//       variantList = variants;
//     } else if (req.body.variant_id && req.body.quantity && req.body.cost_price) {
//       variantList = [{
//         variant_id: req.body.variant_id,
//         quantity: req.body.quantity,
//         cost_price: req.body.cost_price
//       }];
//     } else {
//       return res.status(400).json({ message: 'variants array or variant_id, quantity, cost_price required.' });
//     }

//     const results = [];
//     for (const v of variantList) {
//       const { variant_id, quantity, cost_price } = v;
//       if (!variant_id || !quantity || !cost_price) {
//         results.push({ variant_id, error: 'variant_id, quantity, and cost_price are required.' });
//         continue;
//       }

     
//       const supplyRes = await pool.query(
//         `INSERT INTO supply_entries (supplier_id, variant_id, quantity, cost_price, expected_delivery_date, supply_order_date, supply_status, business_id) 
//          VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
//         [supplier_id || null, variant_id, quantity, cost_price, expected_delivery_date, supply_order_date, supply_status, business_id]
//       );

//       results.push({ variant_id, message: 'Supply entry created', supply_entry: supplyRes.rows[0] });
//     }

//     return res.status(200).json({ results });

//   } catch (err) {
//     console.error(err);
//     return res.status(500).json({ message: 'Server error.' });
//   }
// };

exports.createSupplyOrder = async (req, res) => {
  try {
    const { business_id, variants, expected_delivery_date, supply_order_date, supply_status = 'awaiting_payment', supplier_id } = req.body;
    if (!business_id) return res.status(400).json({ message: 'business_id is required.' });
    if (!supplier_id || !Array.isArray(variants) || variants.length === 0) {
      return res.status(400).json({ message: 'supplier_id and variants array are required.' });
    }

    
    const orderRes = await pool.query(
      `INSERT INTO supply_orders (supplier_id, business_id, expected_delivery_date, supply_order_date, supply_status) 
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [supplier_id, business_id, expected_delivery_date, supply_order_date, supply_status]
    );
    const supplyOrder = orderRes.rows[0];

  
    const items = [];
    for (const v of variants) {
      const { variant_id, quantity, cost_price } = v;
      if (!variant_id || !quantity || !cost_price) continue;
      const itemRes = await pool.query(
        `INSERT INTO supply_order_items (supply_order_id, variant_id, quantity, cost_price)
         VALUES ($1,$2,$3,$4) RETURNING *`,
        [supplyOrder.id, variant_id, quantity, cost_price]
      );
      items.push(itemRes.rows[0]);
    }

    return res.status(201).json({ message: 'Supply order created.', supply_order: supplyOrder, items });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

exports.updateSupplyStatus = async (req, res) => {
  try {
    const {business_id, supply_order_id, supply_status } = req.body;
    
    if (!supply_order_id || !supply_status) {
      return res.status(400).json({ message: 'supply_order_id and supply_status are required.' });
    }

    const allowed = ['awaiting_payment', 'paid', 'delivered', 'cancelled'];
    if (!allowed.includes(supply_status)) {
      return res.status(400).json({ message: 'Invalid supply_status.' });
    }

  
    const orderRes = await pool.query(
      'SELECT * FROM supply_orders WHERE id = $1 AND business_id = $2',
      [supply_order_id, business_id]
    );
    if (orderRes.rows.length === 0) {
      return res.status(404).json({ message: 'Supply order not found.' });
    }
    const order = orderRes.rows[0];

    const itemsRes = await pool.query(
      'SELECT * FROM supply_order_items WHERE supply_order_id = $1',
      [supply_order_id]
    );
    const items = itemsRes.rows;

   
    if (supply_status === 'delivered') {
      const recorded_by = req.user?.staff_id || req.user?.id;
      const recorded_by_type = req.user?.staff_id ? 'staff' : 'user';

      for (const item of items) {
        const variantRes = await pool.query('SELECT * FROM variants WHERE id = $1', [item.variant_id]);
        if (variantRes.rows.length === 0) continue;
        const variant = variantRes.rows[0];

        const newQty = variant.quantity + item.quantity;
        const newCostPrice = item.cost_price !== variant.cost_price ? item.cost_price : variant.cost_price;

        await pool.query('UPDATE variants SET quantity = $1, cost_price = $2 WHERE id = $3',
          [newQty, newCostPrice, variant.id]);

        await pool.query(
          `INSERT INTO inventory_logs (variant_id, type, quantity, note, business_id, branch_id, recorded_by, recorded_by_type) 
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
          [
            variant.id,
            'restock',
            item.quantity,
            `Supply delivered (order ID: ${supply_order_id})`,
            business_id,
            variant.branch_id || null,
            recorded_by,
            recorded_by_type
          ]
        );
      }
    }

   
    const updated = await pool.query(
      'UPDATE supply_orders SET supply_status = $1 WHERE id = $2 RETURNING *',
      [supply_status, supply_order_id]
    );

    return res.status(200).json({ message: 'Supply status updated.', supply_order: updated.rows[0] });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};



exports.getSupplyOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const business_id = req.query.business_id || req.body.business_id || req.params.business_id;
    if (!business_id) return res.status(400).json({ message: 'business_id is required as a query or param.' });

    
    const orderRes = await pool.query(
      `SELECT so.*, s.name as supplier_name
       FROM supply_orders so
       LEFT JOIN suppliers s ON so.supplier_id = s.id
       WHERE so.id = $1 AND so.business_id = $2`,
      [id, business_id]
    );
    if (orderRes.rows.length === 0) {
      return res.status(404).json({ message: 'Supply order not found.' });
    }

   
    const itemsRes = await pool.query(
      `SELECT soi.*, v.sku
       FROM supply_order_items soi
       LEFT JOIN variants v ON soi.variant_id = v.id
       WHERE soi.supply_order_id = $1`,
      [id]
    );

    return res.status(200).json({ supply_order: orderRes.rows[0], items: itemsRes.rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};


exports.getSupplyOrders = async (req, res) => {
  try {
    const business_id = req.query.business_id || req.body.business_id || req.params.business_id;
    if (!business_id) return res.status(400).json({ message: 'business_id is required as a query or param.' });

   
    const ordersRes = await pool.query(
      `SELECT so.*, s.name as supplier_name
       FROM supply_orders so
       LEFT JOIN suppliers s ON so.supplier_id = s.id
       WHERE so.business_id = $1
       ORDER BY so.created_at DESC`,
      [business_id]
    );
    const orders = ordersRes.rows;

    
    const orderIds = orders.map(o => o.id);
    let items = [];
    if (orderIds.length > 0) {
      const itemsRes = await pool.query(
        `SELECT soi.*, v.sku
         FROM supply_order_items soi
         LEFT JOIN variants v ON soi.variant_id = v.id
         WHERE soi.supply_order_id = ANY($1::int[])`,
        [orderIds]
      );
      items = itemsRes.rows;
    }

    return res.status(200).json({ supply_orders: orders, items });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

exports.deleteSupplyOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const business_id = req.business_id;

    const orderRes = await pool.query(
      'DELETE FROM supply_orders WHERE id = $1 AND business_id = $2 RETURNING *',
      [id, business_id]
    );

    if (orderRes.rows.length === 0) {
      return res.status(404).json({ message: 'Supply order not found.' });
    }

    return res.status(200).json({ message: 'Supply order deleted.' });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};


exports.getStockMovements = async (req, res) => {
  try {
    const business_id = req.business_id;
    if (!business_id) return res.status(400).json({ message: 'business_id is required.' });
    const result = await pool.query('SELECT * FROM inventory_logs WHERE business_id = $1 ORDER BY created_at DESC', [business_id]);
    return res.status(200).json({ logs: result.rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};



exports.adjustStock = async (req, res) => {
  try {
    const { adjustments } = req.body;
    const business_id = req.business_id;  
    const branch_id = req.branch_id;      
    const recorded_by = req.user?.staff_id || req.user?.id;
    const recorded_by_type = req.user?.staff_id ? 'staff' : 'user';

    if (!business_id) {
      return res.status(400).json({ message: 'business_id is required.' });
    }

    let adjList = [];
    if (Array.isArray(adjustments)) {
      adjList = adjustments;
    } else if (req.body.variant_id && typeof req.body.new_quantity === 'number') {
      adjList = [{
        variant_id: req.body.variant_id,
        new_quantity: req.body.new_quantity,
        reason: req.body.reason,
        type: req.body.type,
        notes: req.body.notes
      }];
    } else {
      return res.status(400).json({ message: 'adjustments array or variant_id/new_quantity required.' });
    }

    const results = [];

    for (const adj of adjList) {
      const { variant_id, new_quantity, reason, type, notes } = adj;

      if (!variant_id || typeof new_quantity !== 'number' || !reason || !type) {
        results.push({ variant_id, error: 'variant_id, new_quantity, type, and reason are required.' });
        continue;
      }

      const variantRes = await pool.query('SELECT * FROM variants WHERE id = $1', [variant_id]);
      if (variantRes.rows.length === 0) {
        results.push({ variant_id, error: 'Variant not found.' });
        continue;
      }

      const old_quantity = variantRes.rows[0].quantity;
      const quantity_change = new_quantity - old_quantity;

      await pool.query('UPDATE variants SET quantity = $1 WHERE id = $2', [new_quantity, variant_id]);

      await pool.query(
        `INSERT INTO inventory_logs (variant_id, type, quantity, note, business_id, branch_id, recorded_by, recorded_by_type) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          variant_id,
          type,
          quantity_change,
          notes || reason,
          business_id,
          branch_id,
          recorded_by,
          recorded_by_type
        ]
      );

      await StockNotificationService.checkLowStock(variant_id, business_id);
      await StockNotificationService.checkOutOfStock(variant_id, business_id);

      await AuditService.logStockAction(
        'adjustment',
        variant_id,
        business_id,
        req.user,
        { old_quantity, new_quantity, quantity_change, reason, type },
        req
      );

      results.push({
        variant_id,
        message: 'Stock adjusted',
        old_quantity,
        new_quantity,
        quantity_change
      });
    }

    return res.status(200).json({ results });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};



exports.getFastMoving = async (req, res) => {
  try {
    const business_id = req.business_id;
    if (!business_id) return res.status(400).json({ message: 'business_id is required.' });
    const result = await pool.query("SELECT variant_id, SUM(quantity) as total_sold FROM inventory_logs WHERE type = 'sale' AND business_id = $1 AND created_at > NOW() - INTERVAL '30 days' GROUP BY variant_id ORDER BY total_sold DESC LIMIT 20", [business_id]);
    return res.status(200).json({ fast_moving: result.rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};


exports.getSlowMoving = async (req, res) => {
  try {
    const business_id = req.business_id;
    if (!business_id) return res.status(400).json({ message: 'business_id is required.' });
    const result = await pool.query("SELECT variant_id, SUM(quantity) as total_sold FROM inventory_logs WHERE type = 'sale' AND business_id = $1 AND created_at > NOW() - INTERVAL '30 days' GROUP BY variant_id ORDER BY total_sold ASC LIMIT 20", [business_id]);
    return res.status(200).json({ slow_moving: result.rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};


exports.getNotifications = async (req, res) => {
  try {
    const business_id = req.business_id;
    if (!business_id) return res.status(400).json({ message: 'business_id is required.' });
    const { limit = 50 } = req.query;
    const notifications = await StockNotificationService.getUnreadNotifications(
      business_id, 
      parseInt(limit)
    );
    return res.status(200).json({ notifications });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

exports.markNotificationAsRead = async (req, res) => {
  try {
    const business_id = req.business_id;
    if (!business_id) return res.status(400).json({ message: 'business_id is required.' });
    const { id } = req.params;
    const user_id = req.user?.staff_id || req.user?.id;
    // Optionally, you can check if the notification belongs to the business_id before marking as read
    await StockNotificationService.markAsRead(id, user_id, business_id);
    return res.status(200).json({ message: 'Notification marked as read.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

exports.getNotificationStats = async (req, res) => {
  try {
    const business_id = req.business_id;
    if (!business_id) return res.status(400).json({ message: 'business_id is required.' });
    const stats = await StockNotificationService.getNotificationStats(business_id);
    return res.status(200).json({ stats });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};


// Get stock movement logs for a specific variant
exports.getStockMovementsByVariant = async (req, res) => {
  try {
    const business_id = req.business_id;
    const { id } = req.params;
    if (!business_id) return res.status(400).json({ message: 'business_id is required.' });
    if (!id) return res.status(400).json({ message: 'Variant ID is required.' });
    const logs = await pool.query(
      'SELECT * FROM inventory_logs WHERE business_id = $1 AND variant_id = $2 ORDER BY created_at DESC',
      [business_id, id]
    );
    return res.status(200).json({ logs: logs.rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

// Delete a stock movement log
exports.deleteStockMovement = async (req, res) => {
  try {
    const business_id = req.business_id;
    const { id } = req.params;
    if (!business_id) return res.status(400).json({ message: 'business_id is required.' });
    if (!id) return res.status(400).json({ message: 'Log ID is required.' });
    // Optionally, check if the log belongs to the business
    const logRes = await pool.query('DELETE FROM inventory_logs WHERE id = $1 AND business_id = $2 RETURNING *', [id, business_id]);
    if (logRes.rows.length === 0) {
      return res.status(404).json({ message: 'Stock movement log not found.' });
    }
    return res.status(200).json({ message: 'Stock movement deleted.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

// Get low stock items
exports.getLowStock = async (req, res) => {
  try {
    const business_id = req.business_id;
    if (!business_id) return res.status(400).json({ message: 'business_id is required.' });
    const result = await pool.query(
      'SELECT * FROM variants WHERE business_id = $1 AND quantity <= threshold AND deleted_at IS NULL ORDER BY quantity ASC',
      [business_id]
    );
    return res.status(200).json({ low_stock: result.rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

// Get out of stock items
exports.getOutOfStock = async (req, res) => {
  try {
    const business_id = req.business_id;
    if (!business_id) return res.status(400).json({ message: 'business_id is required.' });
    const result = await pool.query(
      'SELECT * FROM variants WHERE business_id = $1 AND quantity = 0 AND deleted_at IS NULL ORDER BY updated_at DESC',
      [business_id]
    );
    return res.status(200).json({ out_of_stock: result.rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

// Get expired stock
exports.getExpiredStock = async (req, res) => {
  try {
    const business_id = req.business_id;
    if (!business_id) return res.status(400).json({ message: 'business_id is required.' });
    const today = new Date().toISOString().split('T')[0];
    const result = await pool.query(
      'SELECT * FROM variants WHERE business_id = $1 AND expiry_date IS NOT NULL AND expiry_date < $2 AND deleted_at IS NULL ORDER BY expiry_date ASC',
      [business_id, today]
    );
    return res.status(200).json({ expired_stock: result.rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

// Get recently restocked items
exports.getRecentlyRestocked = async (req, res) => {
  try {
    const business_id = req.business_id;
    if (!business_id) return res.status(400).json({ message: 'business_id is required.' });
    // Get variants with recent restock logs (last 7 days)
    const result = await pool.query(
      `SELECT v.* FROM variants v
        JOIN inventory_logs il ON v.id = il.variant_id
        WHERE il.business_id = $1 AND il.type = 'restock' AND il.created_at > NOW() - INTERVAL '7 days'
        AND v.deleted_at IS NULL
        GROUP BY v.id
        ORDER BY MAX(il.created_at) DESC`,
      [business_id]
    );
    return res.status(200).json({ recently_restocked: result.rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};