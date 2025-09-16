const pool = require('../config/db');

exports.createTax = async (req, res) => {
  try {
    const { business_id, name, rate, type, description } = req.body;
    if (!business_id || !name || !rate || !type) return res.status(400).json({ message: 'Missing required fields.' });
    const result = await pool.query('INSERT INTO taxes (business_id, name, rate, type, description) VALUES ($1, $2, $3, $4, $5) RETURNING *', [business_id, name, rate, type, description]);
    return res.status(201).json({ tax: result.rows[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};
exports.listTaxes = async (req, res) => {
  try {
    const { business_id } = req.query;
    let query = 'SELECT * FROM taxes';
    let params = [];

    if (business_id) {
      query += ' WHERE business_id = $1';
      params.push(business_id);
    }

    const result = await pool.query(query, params);
    return res.status(200).json({ taxes: result.rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};
exports.linkTaxToProduct = async (req, res) => {
  try {
    const { product_id, tax_id } = req.body;
    if (!product_id || !tax_id) return res.status(400).json({ message: 'Missing required fields.' });
    const result = await pool.query('INSERT INTO product_taxes (product_id, tax_id) VALUES ($1, $2) RETURNING *', [product_id, tax_id]);
    return res.status(201).json({ product_tax: result.rows[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};
