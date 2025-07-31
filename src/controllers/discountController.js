const pool = require('../config/db');

exports.createDiscount = async (req, res) => {
  try {
    const { business_id, name, percentage, amount, start_date, end_date, description } = req.body;
    if (!business_id || !name || !percentage) return res.status(400).json({ message: 'Missing required fields.' });
    const result = await pool.query('INSERT INTO discounts (business_id, name, percentage, amount, start_date, end_date, description) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *', [business_id, name, percentage, amount, start_date, end_date, description]);
    return res.status(201).json({ discount: result.rows[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};
exports.listDiscounts = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM discounts');
    return res.status(200).json({ discounts: result.rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};
exports.linkDiscountToProduct = async (req, res) => {
  try {
    const { product_id, discount_id } = req.body;
    if (!product_id || !discount_id) return res.status(400).json({ message: 'Missing required fields.' });
    const result = await pool.query('INSERT INTO product_discounts (product_id, discount_id) VALUES ($1, $2) RETURNING *', [product_id, discount_id]);
    return res.status(201).json({ product_discount: result.rows[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};
