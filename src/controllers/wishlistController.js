// src/controllers/wishlistController.js
const db = require('../config/db');

exports.addToWishlist = async (req, res) => {
  try {
    const customer_id = req.user.id;
    const { variant_id } = req.body;
    let wishlist = await db.query('SELECT * FROM wishlists WHERE customer_id = $1', [customer_id]);
    if (wishlist.rows.length === 0) {
      wishlist = await db.query('INSERT INTO wishlists (customer_id) VALUES ($1) RETURNING *', [customer_id]);
    }
    const wishlist_id = wishlist.rows[0].id;
    await db.query('INSERT INTO wishlist_items (wishlist_id, variant_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [wishlist_id, variant_id]);
    res.status(200).json({ message: 'Added to wishlist.' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to add to wishlist', details: err.message });
  }
};

exports.removeFromWishlist = async (req, res) => {
  try {
    const customer_id = req.user.id;
    const { variant_id } = req.body;
    let wishlist = await db.query('SELECT * FROM wishlists WHERE customer_id = $1', [customer_id]);
    if (wishlist.rows.length === 0) return res.status(404).json({ message: 'Wishlist not found.' });
    const wishlist_id = wishlist.rows[0].id;
    await db.query('DELETE FROM wishlist_items WHERE wishlist_id = $1 AND variant_id = $2', [wishlist_id, variant_id]);
    res.status(200).json({ message: 'Removed from wishlist.' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to remove from wishlist', details: err.message });
  }
};

exports.getWishlist = async (req, res) => {
  try {
    const customer_id = req.user.id;
    let wishlist = await db.query('SELECT * FROM wishlists WHERE customer_id = $1', [customer_id]);
    if (wishlist.rows.length === 0) return res.status(200).json({ wishlist: [], items: [] });
    const wishlist_id = wishlist.rows[0].id;
    const items = await db.query(`SELECT wi.*, v.*, p.name as product_name FROM wishlist_items wi
      JOIN variants v ON wi.variant_id = v.id
      JOIN products p ON v.product_id = p.id
      WHERE wi.wishlist_id = $1`, [wishlist_id]);
    res.status(200).json({ wishlist: wishlist.rows[0], items: items.rows });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch wishlist', details: err.message });
  }
};
