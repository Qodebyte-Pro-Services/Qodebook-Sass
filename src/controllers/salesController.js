const pool = require('../config/db');


exports.createSale = async (req, res) => {
  try {
    const { business_id, branch_id, staff_id, created_by_user_id, customer_id, items, total_amount, payment_mode, discount, coupon, taxes, note, order_type  } = req.body;
    if (!business_id || !branch_id || !items || !Array.isArray(items) || items.length === 0 || !total_amount || !payment_mode) {
      return res.status(400).json({ message: 'Missing required fields.' });
    }

      if (!staff_id && !created_by_user_id) {
      return res.status(400).json({ message: 'Sale must be recorded by a staff or a user.' });
    }

    let customerId = customer_id ? Number(customer_id) : null;

if (customerId === 0) {
      const existingCustomer = await pool.query(
        'SELECT id FROM customers WHERE business_id = $1 AND id = 0 LIMIT 1',
        [business_id]
      );

      if (existingCustomer.rows.length === 0) {
        await pool.query(
          'INSERT INTO customers (id, business_id, name, phone, email) VALUES (0, $1, $2, $3, $4)',
          [business_id, 'Walk-in', null, null]
        );
      }

      customerId = 0;
    } else if (!customerId && req.body.customer) {
      const c = req.body.customer;
      const custRes = await pool.query(
        'INSERT INTO customers (business_id, name, phone, email) VALUES ($1, $2, $3, $4) RETURNING id',
        [business_id, c.name, c.phone, c.email]
      );
      customerId = custRes.rows[0].id;
    }

    const orderRes = await pool.query(
      'INSERT INTO orders (business_id, branch_id, customer_id, total_amount, status, order_type) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [business_id, branch_id, customerId, total_amount, 'completed', order_type || 'walk_in']
    );
    const order = orderRes.rows[0];

    let recorded_by, recorded_by_type;
    if (staff_id) {
      recorded_by = String(staff_id);
      recorded_by_type = 'staff';
    } else {
      recorded_by = String(created_by_user_id);
      recorded_by_type = 'user';
    }

    
    for (const item of items) {
     
      await pool.query(
        'INSERT INTO order_items (order_id, variant_id, quantity, unit_price, total_price) VALUES ($1, $2, $3, $4, $5)',
        [order.id, item.variant_id, item.quantity, item.unit_price, item.total_price]
      );

    
      const variantRes = await pool.query('SELECT quantity FROM variants WHERE id = $1', [item.variant_id]);
      if (variantRes.rows.length === 0) continue;
      const old_quantity = variantRes.rows[0].quantity;
      const new_quantity = old_quantity - item.quantity;
      const quantity_change = item.quantity;
      const reason = 'decrease'; 

      await pool.query('UPDATE variants SET quantity = $1 WHERE id = $2', [new_quantity, item.variant_id]);

      
      await pool.query(
        `INSERT INTO inventory_logs 
         (variant_id, type, quantity, reason, note, business_id, branch_id, recorded_by, recorded_by_type) 
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [
          item.variant_id,
          'sale',                     
          quantity_change,            
          'decrease' ,                    
          note || 'POS Sale transaction',
          business_id,
          branch_id,
          recorded_by,
          recorded_by_type
        ]
      );

     
      if (item.taxes && Array.isArray(item.taxes)) {
        for (const taxId of item.taxes) {
          await pool.query('INSERT INTO product_taxes (product_id, tax_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [item.variant_id, taxId]);
        }
      }
      if (item.discounts && Array.isArray(item.discounts)) {
        for (const discountId of item.discounts) {
          await pool.query('INSERT INTO product_discounts (product_id, discount_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [item.variant_id, discountId]);
        }
      }
      if (item.coupons && Array.isArray(item.coupons)) {
        for (const couponId of item.coupons) {
          await pool.query('INSERT INTO product_coupons (product_id, coupon_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [item.variant_id, couponId]);
        }
      }
    }

    
    if (note) {
      await pool.query(
        'UPDATE orders SET note = $1 WHERE id = $2',
        [note, order.id]
      );
    }

   const saleRes = await pool.query(`
      SELECT o.*, 
        c.name AS customer_name, c.phone AS customer_phone, c.email AS customer_email,
        b.branch_name AS branch_name,
        COALESCE(s.full_name, CONCAT(u.first_name, ' ', u.last_name), '') AS recorded_by_name
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      LEFT JOIN branches b ON o.branch_id = b.id
      LEFT JOIN staff s ON o.staff_id = s.staff_id
      LEFT JOIN users u ON o.created_by_user_id = u.id
      WHERE o.id = $1
    `, [order.id]);

    const itemsRes = await pool.query(`
      SELECT oi.*, 
        v.sku, v.name AS variant_name, v.attributes, v.selling_price
      FROM order_items oi
      LEFT JOIN variants v ON oi.variant_id = v.id
      WHERE oi.order_id = $1
    `, [order.id]);

    return res.status(201).json({
      sale: saleRes.rows[0],
      items: itemsRes.rows
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.', details: err.message });
  }
};



exports.listSales = async (req, res) => {
  try {
    const { business_id, branch_id } = req.query;
    let whereClauses = [`o.status = 'completed'`];
    let params = [];
    let idx = 1;

    if (business_id) {
      whereClauses.push(`o.business_id = $${idx}`);
      params.push(business_id);
      idx++;
    }
    if (branch_id) {
      whereClauses.push(`o.branch_id = $${idx}`);
      params.push(branch_id);
      idx++;
    }

    const query = `
      SELECT o.*, 
        c.name AS customer_name, c.phone AS customer_phone, c.email AS customer_email,
        b.branch_name AS branch_name,
        COALESCE(s.full_name, CONCAT(u.first_name, ' ', u.last_name), '') AS recorded_by_name
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      LEFT JOIN branches b ON o.branch_id = b.id
      LEFT JOIN staff s ON o.staff_id = s.staff_id
      LEFT JOIN users u ON o.created_by_user_id = u.id
      WHERE ${whereClauses.join(' AND ')}
      ORDER BY o.created_at DESC
    `;

    const result = await pool.query(query, params);
    return res.status(200).json({ sales: result.rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

exports.getSale = async (req, res) => {
  try {
    const { id } = req.params;
    const saleRes = await pool.query(`
      SELECT o.*, 
        c.name AS customer_name, c.phone AS customer_phone, c.email AS customer_email,
        b.branch_name AS branch_name,
        COALESCE(s.full_name, CONCAT(u.first_name, ' ', u.last_name), '') AS recorded_by_name
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      LEFT JOIN branches b ON o.branch_id = b.id
      LEFT JOIN staff s ON o.staff_id = s.staff_id
      LEFT JOIN users u ON o.created_by_user_id = u.id
      WHERE o.id = $1
    `, [id]);
    if (saleRes.rows.length === 0) return res.status(404).json({ message: 'Sale not found.' });

    const itemsRes = await pool.query(`
      SELECT oi.*, 
        v.sku, v.name AS variant_name, v.attributes, v.selling_price
      FROM order_items oi
      LEFT JOIN variants v ON oi.variant_id = v.id
      WHERE oi.order_id = $1
    `, [id]);

    return res.status(200).json({
      sale: saleRes.rows[0],
      items: itemsRes.rows
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};


exports.refundSale = async (req, res) => {
  try {
    const { id } = req.params;
   
    await pool.query('UPDATE orders SET status = $1 WHERE id = $2', ['canceled', id]);
   
    return res.status(200).json({ message: 'Sale refunded.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};
