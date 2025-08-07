// src/controllers/loyaltyController.js
const db = require('../config/db');

// Get current points for a customer
exports.getPoints = async (req, res) => {
  try {
    const customer_id = req.user.id;
    const result = await db.query('SELECT points FROM loyalty_points WHERE customer_id = $1', [customer_id]);
    res.status(200).json({ points: result.rows[0]?.points || 0 });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch points', details: err.message });
  }
};

// Get points transaction history
exports.getTransactions = async (req, res) => {
  try {
    const customer_id = req.user.id;
    const result = await db.query('SELECT * FROM loyalty_point_transactions WHERE customer_id = $1 ORDER BY created_at DESC', [customer_id]);
    res.status(200).json({ transactions: result.rows });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch transactions', details: err.message });
  }
};

// Redeem points (for rewards, discounts, etc.)
exports.redeemPoints = async (req, res) => {
  try {
    const customer_id = req.user.id;
    const { points, reason } = req.body;
    if (!points || points <= 0) return res.status(400).json({ message: 'Points to redeem must be positive.' });
    const result = await db.query('SELECT points FROM loyalty_points WHERE customer_id = $1', [customer_id]);
    const current = result.rows[0]?.points || 0;
    if (current < points) return res.status(400).json({ message: 'Insufficient points.' });
    await db.query('UPDATE loyalty_points SET points = points - $1, last_updated = CURRENT_TIMESTAMP WHERE customer_id = $2', [points, customer_id]);
    await db.query('INSERT INTO loyalty_point_transactions (customer_id, points_change, reason) VALUES ($1, $2, $3)', [customer_id, -points, reason || 'Redeemed']);
    res.status(200).json({ message: 'Points redeemed.' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to redeem points', details: err.message });
  }
};

// (Optional) Add points (for admin/testing)
exports.addPoints = async (req, res) => {
  try {
    const customer_id = req.user.id;
    const { points, reason } = req.body;
    if (!points || points <= 0) return res.status(400).json({ message: 'Points to add must be positive.' });
    await db.query(`INSERT INTO loyalty_points (customer_id, points, last_updated)
      VALUES ($1, $2, CURRENT_TIMESTAMP)
      ON CONFLICT (customer_id) DO UPDATE SET points = loyalty_points.points + $2, last_updated = CURRENT_TIMESTAMP`, [customer_id, points]);
    await db.query('INSERT INTO loyalty_point_transactions (customer_id, points_change, reason) VALUES ($1, $2, $3)', [customer_id, points, reason || 'Earned']);
    res.status(200).json({ message: 'Points added.' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to add points', details: err.message });
  }
};
