// src/controllers/reviewController.js
const db = require('../config/db');

exports.addReview = async (req, res) => {
  try {
    const customer_id = req.user.id;
    const { product_id, rating, comment } = req.body;
    if (!product_id || !rating) return res.status(400).json({ message: 'product_id and rating are required.' });
    await db.query('INSERT INTO reviews (customer_id, product_id, rating, comment) VALUES ($1, $2, $3, $4)', [customer_id, product_id, rating, comment]);
    res.status(201).json({ message: 'Review added.' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to add review',  });
  }
};

exports.getReviews = async (req, res) => {
  try {
    const { product_id } = req.params;
    const result = await db.query('SELECT r.*, c.name as customer_name FROM reviews r JOIN customers c ON r.customer_id = c.id WHERE r.product_id = $1 ORDER BY r.created_at DESC', [product_id]);
    res.status(200).json({ reviews: result.rows });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch reviews',  });
  }
};
