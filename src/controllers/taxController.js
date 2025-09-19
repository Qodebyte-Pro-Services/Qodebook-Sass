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

exports.getListOfProductsAndTheirTaxes = async (req, res) =>  {
  try {
    const { business_id } = req.query;
    if (!business_id) return res.status(400).json({ message: 'Missing business_id parameter.' });
    const result = await pool.query(
      `SELECT p.id AS product_id, p.name AS product_name, t.id AS tax_id, t.name AS tax_name, t.rate, t.type
        FROM products p
        LEFT JOIN product_taxes pt ON p.id = pt.product_id
        LEFT JOIN taxes t ON pt.tax_id = t.id
        WHERE p.business_id = $1`,
      [business_id]
    );
    return res.status(200).json({ products_with_taxes: result.rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
}

exports.getTaxesForProduct = async (req, res) => {
  try {
    const { product_id } = req.params;
    if (!product_id) return res.status(400).json({ message: 'Missing product_id parameter.' });
    const result = await pool.query(
      `SELECT t.* FROM taxes t
       JOIN product_taxes pt ON t.id = pt.tax_id
       WHERE pt.product_id = $1`,
      [product_id]
    );
    return res.status(200).json({ taxes: result.rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
}


exports.getTaxesForVariantsBasedOnProduct = async (req, res) => {
  try {
    const { product_id } = req.params;
    if (!product_id) return res.status(400).json({ message: 'Missing product_id parameter.' });
    const result = await pool.query(
      `SELECT t.* FROM taxes t
        JOIN product_taxes pt ON t.id = pt.tax_id
        WHERE pt.product_id = $1`,
      [product_id]
    );
    return res.status(200).json({ taxes: result.rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
}