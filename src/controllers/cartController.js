
const db = require('../config/db');


exports.addToCart = async (req, res) => {
  try {
    const { variant_id, quantity } = req.body;
    const customer_id = req.user ? req.user.id : null; 
    if (!variant_id || !quantity) return res.status(400).json({ message: 'variant_id and quantity are required.' });
    if (customer_id) {
    
      let cart = await db.query('SELECT * FROM carts WHERE customer_id = $1', [customer_id]);
      if (cart.rows.length === 0) {
        cart = await db.query('INSERT INTO carts (customer_id) VALUES ($1) RETURNING *', [customer_id]);
      }
      const cart_id = cart.rows[0].id;
      const variantCheck = await db.query(`
  SELECT v.id FROM variants v
  JOIN products p ON v.product_id = p.id
  WHERE v.id = $1 AND p.business_id = $2
`, [variant_id, req.user.business_id]);

if (variantCheck.rows.length === 0) {
  return res.status(403).json({ message: 'Variant not found or not accessible for this business.' });
}
      await db.query(`INSERT INTO cart_items (cart_id, variant_id, quantity) VALUES ($1, $2, $3)
        ON CONFLICT (cart_id, variant_id) DO UPDATE SET quantity = cart_items.quantity + $3`, [cart_id, variant_id, quantity]);
      return res.status(200).json({ message: 'Added to cart.' });
    } else {
   
      return res.status(200).json({ message: 'Guest cart handled on frontend.' });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};


exports.removeFromCart = async (req, res) => {
  try {
    const { variant_id } = req.body;
    const customer_id = req.user ? req.user.id : null;
    if (!variant_id) return res.status(400).json({ message: 'variant_id is required.' });
    if (customer_id) {
      let cart = await db.query('SELECT * FROM carts WHERE customer_id = $1', [customer_id]);
      if (cart.rows.length === 0) return res.status(404).json({ message: 'Cart not found.' });
      const cart_id = cart.rows[0].id;
      await db.query('DELETE FROM cart_items WHERE cart_id = $1 AND variant_id = $2', [cart_id, variant_id]);
      return res.status(200).json({ message: 'Removed from cart.' });
    } else {
      return res.status(200).json({ message: 'Guest cart handled on frontend.' });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};


exports.getCart = async (req, res) => {
  try {
    const customer_id = req.user ? req.user.id : null;
    if (customer_id) {
      let cart = await db.query('SELECT * FROM carts WHERE customer_id = $1', [customer_id]);
      if (cart.rows.length === 0) return res.status(200).json({ cart: [], items: [] });
      const cart_id = cart.rows[0].id;
     const items = await db.query(`
  SELECT ci.*, v.*, p.name as product_name
  FROM cart_items ci
  JOIN variants v ON ci.variant_id = v.id
  JOIN products p ON v.product_id = p.id
  WHERE ci.cart_id = $1 AND p.business_id = $2
`, [cart_id, req.user.business_id]);
      return res.status(200).json({ cart: cart.rows[0], items: items.rows });
    } else {
      return res.status(200).json({ cart: null, items: [] });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};
