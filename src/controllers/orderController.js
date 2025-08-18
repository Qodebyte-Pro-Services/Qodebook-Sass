const pool = require('../config/db');


exports.createOrder = async (req, res) => {
  try {
    const { business_id, branch_id, customer_id, items, total_amount, status } = req.body;
    if (!business_id || !branch_id || !items || !Array.isArray(items) || items.length === 0 || !total_amount || !status) {
      return res.status(400).json({ message: 'Missing required fields.' });
    }
    const orderRes = await pool.query('INSERT INTO orders (business_id, branch_id, customer_id, total_amount, status) VALUES ($1, $2, $3, $4, $5) RETURNING *', [business_id, branch_id, customer_id, total_amount, status]);
    const order = orderRes.rows[0];
    const recorded_by_type = req.user.staff_id ? 'staff' : 'user';
    for (const item of items) {
      await pool.query('INSERT INTO order_items (order_id, variant_id, quantity, unit_price, total_price) VALUES ($1, $2, $3, $4, $5)', [order.id, item.variant_id, item.quantity, item.unit_price, item.total_price]);
     
      await pool.query('UPDATE variants SET quantity = quantity - $1 WHERE id = $2', [item.quantity, item.variant_id]);
      
      await pool.query('INSERT INTO inventory_logs (variant_id, type, quantity, note, business_id, branch_id, recorded_by, recorded_by_type) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)', [item.variant_id, 'sale', item.quantity, 'Order sale', business_id, branch_id, req.user?.staff_id || req.user?.id, recorded_by_type]);
    }
    return res.status(201).json({ order });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
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
    const result = await pool.query('UPDATE orders SET status = $1 WHERE id = $2 RETURNING *', [status, id]);
    return res.status(200).json({ order: result.rows[0] });
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
