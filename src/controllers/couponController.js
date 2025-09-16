const pool = require('../config/db');

exports.createCoupon = async (req, res) => {
  try {
    const { business_id, code, description, discount_percentage, discount_amount, start_date, end_date, usage_limit } = req.body;
    if (!business_id || !code) return res.status(400).json({ message: 'Missing required fields.' });
    const result = await pool.query('INSERT INTO coupons (business_id, code, description, discount_percentage, discount_amount, start_date, end_date, usage_limit) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *', [business_id, code, description, discount_percentage, discount_amount, start_date, end_date, usage_limit]);
    return res.status(201).json({ coupon: result.rows[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};
exports.listCoupons = async (req, res) => {
  try {
    const { business_id } = req.query;
    let query = 'SELECT * FROM coupons';
    let params = [];

    if (business_id) {
      query += ' WHERE business_id = $1';
      params.push(business_id);
    }

    const result = await pool.query(query, params);
    return res.status(200).json({ coupons: result.rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};
exports.linkCouponToProduct = async (req, res) => {
  try {
    const { product_id, coupon_id } = req.body;
    if (!product_id || !coupon_id) return res.status(400).json({ message: 'Missing required fields.' });
    const result = await pool.query('INSERT INTO product_coupons (product_id, coupon_id) VALUES ($1, $2) RETURNING *', [product_id, coupon_id]);
    return res.status(201).json({ product_coupon: result.rows[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};
