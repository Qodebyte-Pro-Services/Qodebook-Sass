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
    const { business_id } = req.query;
    let query = 'SELECT * FROM discounts';
    let params = [];

    if (business_id) {
      query += ' WHERE business_id = $1';
      params.push(business_id);
    }

    const result = await pool.query(query, params);
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

exports.getDiscountsForProduct = async (req, res) => {
  try {
    const { product_id } = req.params;
    if (!product_id) return res.status(400).json({ message: 'Missing product_id parameter.' });
    const result = await pool.query(
      `SELECT d.* FROM discounts d
       JOIN product_discounts pd ON d.id = pd.discount_id
        WHERE pd.product_id = $1`,  
      [product_id]
    );
    return res.status(200).json({ discounts: result.rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
}

exports.getDiscountsForVariantsBasedOnProduct = async (req, res) => {
  try {
    const { product_id } = req.params;
    if (!product_id) return res.status(400).json({ message: 'Missing product_id parameter.' });
    const result = await pool.query(
      `SELECT d.* FROM discounts d
       JOIN product_discounts pd ON d.id = pd.discount_id
       JOIN products p ON pd.product_id = p.id
       JOIN variants v ON p.id = v.product_id
       WHERE p.id = $1`,
      [product_id]
    );
    return res.status(200).json({ discounts: result.rows });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
}
