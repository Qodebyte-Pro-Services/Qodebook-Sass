
const db = require('../config/db');


exports.checkout = async (req, res) => {
  try {
    const customer_id = req.user.id;
    const { shipping_address, payment_method } = req.body;
  
    const cartResult = await db.query('SELECT * FROM carts WHERE customer_id = $1', [customer_id]);
    if (cartResult.rows.length === 0) return res.status(400).json({ message: 'Cart is empty.' });
    const cart_id = cartResult.rows[0].id;
    const itemsResult = await db.query('SELECT * FROM cart_items WHERE cart_id = $1', [cart_id]);
    if (itemsResult.rows.length === 0) return res.status(400).json({ message: 'Cart is empty.' });

    const orderResult = await db.query(
      'INSERT INTO orders (customer_id, shipping_address, payment_method, status, source) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [customer_id, shipping_address, payment_method, 'pending', 'ecommerce']
    );
    const order_id = orderResult.rows[0].id;
  
for (const item of itemsResult.rows) {
  const variantCheck = await db.query(`
    SELECT v.price FROM variants v
    JOIN products p ON v.product_id = p.id
    WHERE v.id = $1 AND p.business_id = $2
  `, [item.variant_id, req.user.business_id]);

  if (variantCheck.rows.length === 0) {
    return res.status(400).json({ message: 'Invalid variant in cart for this business.' });
  }

  const price = variantCheck.rows[0].price;
  const total = price * item.quantity;

  await db.query(`
    INSERT INTO order_items (order_id, variant_id, quantity, unit_price, total_price)
    VALUES ($1, $2, $3, $4, $5)
  `, [order_id, item.variant_id, item.quantity, price, total]);
}


    await db.query('DELETE FROM cart_items WHERE cart_id = $1', [cart_id]);
    res.status(201).json({ order: orderResult.rows[0] });
  } catch (err) {
    res.status(500).json({ message: 'Checkout failed',  });
  }
};
