const pool = require('../config/db');


exports.addService = async (req, res) => {
  try {
    const { business_id, name, price, description } = req.body;
    if (!business_id || !name || !price) return res.status(400).json({ message: 'business_id, name, and price are required.' });
    const result = await pool.query('INSERT INTO services (business_id, name, price, description) VALUES ($1, $2, $3, $4) RETURNING *', [business_id, name, price, description]);
    return res.status(201).json({ service: result.rows[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};


exports.listServices = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM services');
    return res.status(200).json({ services: result.rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};
