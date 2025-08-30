const pool = require('../config/db');


exports.createOrder = async (req, res) => {
  try {
  const { business_id, branch_id, customer_id, items, total_amount, status, order_type } = req.body;
    if (!business_id || !branch_id || !items || !Array.isArray(items) || items.length === 0 || !total_amount || !status) {
      return res.status(400).json({ message: 'Missing required fields.' });
    }

    if (!items.every(item => item.variant_id && item.quantity && item.unit_price)) {
  return res.status(400).json({ message: 'Each item must have variant_id, quantity, and unit_price.' });
}

     const orderStatus = status || 'pending';
    const orderType = order_type || 'online_order';

 const orderRes = await pool.query(
      `INSERT INTO orders (business_id, branch_id, customer_id, total_amount, status, order_type)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [business_id, branch_id, customer_id || null, total_amount, orderStatus, orderType]
    );
    const order = orderRes.rows[0];

    

    for (const item of items) {
    
      await pool.query(
        'INSERT INTO order_items (order_id, variant_id, quantity, unit_price, total_price) VALUES ($1, $2, $3, $4, $5)',
        [order.id, item.variant_id, item.quantity, item.unit_price, item.total_price]
      );
    }

    return res.status(201).json({ order });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.', error: err.message });
  }
};



exports.listOrders = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM orders ORDER BY created_at DESC');
    return res.status(200).json({ orders: result.rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};


exports.getOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const orderRes = await pool.query('SELECT * FROM orders WHERE id = $1', [id]);
    if (orderRes.rows.length === 0) return res.status(404).json({ message: 'Order not found.' });
    const itemsRes = await pool.query('SELECT * FROM order_items WHERE order_id = $1', [id]);
    return res.status(200).json({ order: orderRes.rows[0], items: itemsRes.rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};


exports.updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!status) return res.status(400).json({ message: 'Status required.' });

    const orderRes = await pool.query('UPDATE orders SET status = $1 WHERE id = $2 RETURNING *', [status, id]);
    const order = orderRes.rows[0];

   
    if (status === 'paid') {
      const orderItemsRes = await pool.query('SELECT * FROM order_items WHERE order_id = $1', [order.id]);

      for (const item of orderItemsRes.rows) {
        await pool.query('UPDATE variants SET quantity = quantity - $1 WHERE id = $2', [item.quantity, item.variant_id]);

        await pool.query(
          `INSERT INTO inventory_logs 
           (variant_id, type, quantity, reason, note, business_id, branch_id, recorded_by, recorded_by_type) 
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
          [
            item.variant_id,
            'sale',
            item.quantity,
            'decrease',
            'Online Order Payment',
            order.business_id,
            order.branch_id,
            req.user.id,
            req.user.staff_id ? 'staff' : 'user'
          ]
        );
      }
    }

    return res.status(200).json({ order });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};



exports.cancelOrder = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('UPDATE orders SET status = $1 WHERE id = $2', ['canceled', id]);
    return res.status(200).json({ message: 'Order canceled.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};
