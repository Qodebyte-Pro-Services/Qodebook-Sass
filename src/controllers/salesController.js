const pool = require('../config/db');


  exports.createSale = async (req, res) => {
  const client = await pool.connect();

  try {
    const {
      business_id,
      branch_id,
      staff_id,
      created_by_user_id,
      customer_id,
      items,
      payment_mode,
      discount = 0,   // order-level discount
      coupon = 0,     // order-level coupon
      taxes = 0,      // order-level tax
      note,
      order_type
    } = req.body;

    if (!business_id || !branch_id || !items || !Array.isArray(items) || items.length === 0 || !payment_mode) {
      return res.status(400).json({ message: 'Missing required fields.' });
    }

    if (!staff_id && !created_by_user_id) {
      return res.status(400).json({ message: 'Sale must be recorded by a staff or a user.' });
    }

    await client.query('BEGIN');

    // --- Handle customer ---
    let customerId = customer_id ? Number(customer_id) : null;

    if (customerId === 0) {
      const existingCustomer = await client.query(
        'SELECT id FROM customers WHERE business_id = $1 AND id = 0 LIMIT 1',
        [business_id]
      );
      if (existingCustomer.rows.length === 0) {
        await client.query(
          'INSERT INTO customers (id, business_id, name, phone, email) VALUES (0, $1, $2, $3, $4)',
          [business_id, 'Walk-in', null, null]
        );
      }
      customerId = 0;
    } else if (!customerId && req.body.customer) {
      const c = req.body.customer;
      const custRes = await client.query(
        'INSERT INTO customers (business_id, name, phone, email) VALUES ($1, $2, $3, $4) RETURNING id',
        [business_id, c.name, c.phone, c.email]
      );
      customerId = custRes.rows[0].id;
    }

    // --- Totals ---
    let subtotal = 0;
    let tax_total = Number(taxes);       // include order-level taxes
    let discount_total = Number(discount); // include order-level discount
    let coupon_total = Number(coupon);     // include order-level coupon

    // --- Loop items ---
    for (const item of items) {
      subtotal += Number(item.total_price);

      // Item taxes
      if (item.taxes && Array.isArray(item.taxes)) {
        tax_total += item.taxes.reduce((sum, t) => sum + (t.amount || 0), 0);
      }

      // Item discounts
      if (item.discounts && Array.isArray(item.discounts)) {
        discount_total += item.discounts.reduce((sum, d) => sum + (d.amount || 0), 0);
      }

      // Item coupons
      if (item.coupons && Array.isArray(item.coupons)) {
        coupon_total += item.coupons.reduce((sum, c) => sum + (c.amount || 0), 0);
      }
    }

    const total_amount = subtotal + tax_total - discount_total - coupon_total;

    // --- Insert order ---
    const orderRes = await client.query(
      `INSERT INTO orders (
        business_id, branch_id, customer_id,
        subtotal, tax_total, discount_total, coupon_total, total_amount,
        status, order_type, staff_id, created_by_user_id, note
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
      RETURNING *`,
      [
        business_id,
        branch_id,
        customerId,
        subtotal,
        tax_total,
        discount_total,
        coupon_total,
        total_amount,
        'completed',
        order_type || 'walk_in',
        staff_id || null,
        created_by_user_id || null,
        note || null
      ]
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

    // --- Insert items, update inventory, logs, and relations ---
    for (const item of items) {
      await client.query(
        'INSERT INTO order_items (order_id, variant_id, quantity, unit_price, total_price) VALUES ($1,$2,$3,$4,$5)',
        [order.id, item.variant_id, item.quantity, item.unit_price, item.total_price]
      );

      // Update inventory
      const variantRes = await client.query('SELECT quantity FROM variants WHERE id = $1', [item.variant_id]);
      if (variantRes.rows.length > 0) {
        const old_quantity = variantRes.rows[0].quantity;
        const new_quantity = old_quantity - item.quantity;
        await client.query('UPDATE variants SET quantity = $1 WHERE id = $2', [new_quantity, item.variant_id]);

        await client.query(
          `INSERT INTO inventory_logs 
           (variant_id, type, quantity, reason, note, business_id, branch_id, recorded_by, recorded_by_type) 
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
          [
            item.variant_id,
            'sale',
            item.quantity,
            'decrease',
            note || 'POS Sale transaction',
            business_id,
            branch_id,
            recorded_by,
            recorded_by_type
          ]
        );
      }

      // --- Link taxes, discounts, coupons (expecting [{id, amount}] format) ---
      if (item.taxes && Array.isArray(item.taxes)) {
        for (const t of item.taxes) {
          await client.query(
            'INSERT INTO product_taxes (product_id, tax_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
            [item.variant_id, t.id]
          );
        }
      }
      if (item.discounts && Array.isArray(item.discounts)) {
        for (const d of item.discounts) {
          await client.query(
            'INSERT INTO product_discounts (product_id, discount_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
            [item.variant_id, d.id]
          );
        }
      }
      if (item.coupons && Array.isArray(item.coupons)) {
        for (const c of item.coupons) {
          await client.query(
            'INSERT INTO product_coupons (product_id, coupon_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
            [item.variant_id, c.id]
          );
        }
      }
    }

    // --- Commit transaction ---
    await client.query('COMMIT');

    // --- Fetch sale with joins ---
    const saleRes = await pool.query(
      `SELECT o.*, 
        c.name AS customer_name, c.phone AS customer_phone, c.email AS customer_email,
        b.branch_name AS branch_name,
        COALESCE(s.full_name, CONCAT(u.first_name, ' ', u.last_name), '') AS recorded_by_name
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      LEFT JOIN branches b ON o.branch_id = b.id
      LEFT JOIN staff s ON o.staff_id = s.staff_id
      LEFT JOIN users u ON o.created_by_user_id = u.id
      WHERE o.id = $1`,
      [order.id]
    );

    const itemsRes = await pool.query(
      `SELECT oi.*, 
        v.sku AS variant_name, v.attributes, v.quantity, v.selling_price
      FROM order_items oi
      LEFT JOIN variants v ON oi.variant_id = v.id
      WHERE oi.order_id = $1`,
      [order.id]
    );

    return res.status(201).json({
      sale: saleRes.rows[0],
      items: itemsRes.rows
    });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    return res.status(500).json({ message: 'Server error.', details: err.message });
  } finally {
    client.release();
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
        v.sku AS variant_name, v.attributes, v.quantity, v.selling_price
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
