const pool = require('../config/db');


exports.createSale = async (req, res) => {
  try {
    const { business_id, branch_id, staff_id, customer_id, items, total_amount, payment_mode, discount, coupon, taxes, note } = req.body;
    if (!business_id || !branch_id || !items || !Array.isArray(items) || items.length === 0 || !total_amount || !payment_mode) {
      return res.status(400).json({ message: 'Missing required fields.' });
    }
 
    let customerId = customer_id;
    if (!customerId && req.body.customer) {
      const c = req.body.customer;
      const custRes = await pool.query('INSERT INTO customers (business_id, name, phone, email) VALUES ($1, $2, $3, $4) RETURNING id', [business_id, c.name, c.phone, c.email]);
      customerId = custRes.rows[0].id;
    }
    
    const orderRes = await pool.query('INSERT INTO orders (business_id, branch_id, customer_id, total_amount, status) VALUES ($1, $2, $3, $4, $5) RETURNING *', [business_id, branch_id, customerId, total_amount, 'completed']);
    const order = orderRes.rows[0];
    for (const item of items) {
      await pool.query('INSERT INTO order_items (order_id, variant_id, quantity, unit_price, total_price) VALUES ($1, $2, $3, $4, $5)', [order.id, item.variant_id, item.quantity, item.unit_price, item.total_price]);
      await pool.query('UPDATE variants SET quantity = quantity - $1 WHERE id = $2', [item.quantity, item.variant_id]);
      await pool.query('INSERT INTO inventory_logs (variant_id, type, quantity, note) VALUES ($1, $2, $3, $4)', [item.variant_id, 'sale', item.quantity, 'Sale transaction']);

     
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
      await pool.query('UPDATE orders SET status = $1, total_amount = $2, customer_id = $3, branch_id = $4, business_id = $5, created_at = created_at, note = $6 WHERE id = $7', [order.status, order.total_amount, order.customer_id, order.branch_id, order.business_id, note, order.id]);
    }
    return res.status(201).json({ sale: order });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};


exports.listSales = async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM orders WHERE status = 'completed' ORDER BY created_at DESC");
    return res.status(200).json({ sales: result.rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};


exports.getSale = async (req, res) => {
  try {
    const { id } = req.params;
    const orderRes = await pool.query('SELECT * FROM orders WHERE id = $1', [id]);
    if (orderRes.rows.length === 0) return res.status(404).json({ message: 'Sale not found.' });
    const itemsRes = await pool.query('SELECT * FROM order_items WHERE order_id = $1', [id]);
    return res.status(200).json({ sale: orderRes.rows[0], items: itemsRes.rows });
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
