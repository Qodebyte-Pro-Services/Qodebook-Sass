const pool = require('../config/db');


exports.addCategory = async (req, res) => {
  try {
    const { business_id, name } = req.body;
    if (!business_id || !name) return res.status(400).json({ message: 'business_id and name are required.' });
    const result = await pool.query('INSERT INTO service_categories (business_id, name) VALUES ($1, $2) RETURNING *', [business_id, name]);
    return res.status(201).json({ category: result.rows[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};


exports.listCategories = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM service_categories');
    return res.status(200).json({ categories: result.rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};
