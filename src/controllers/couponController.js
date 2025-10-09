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

exports.getListOfProductsAndTheirCoupons = async (req, res) =>  {
  try {
    const { business_id } = req.query;
    if (!business_id) return res.status(400).json({ message: 'Missing business_id parameter.' });
    const result = await pool.query(
      `SELECT p.id AS product_id, p.name AS product_name, c.id AS coupon_id, c.code AS coupon_code, c.description, c.discount_percentage, c.discount_amount, c.start_date, c.end_date
        FROM products p
        LEFT JOIN product_coupons pc ON p.id = pc.product_id
        LEFT JOIN coupons c ON pc.coupon_id = c.id
        WHERE p.business_id = $1`,
      [business_id]
    );
    return res.status(200).json({ products_with_coupons: result.rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
}


exports.getCouponsForProduct = async (req, res) => {
  try {
    const { product_id } = req.params;
    if (!product_id) return res.status(400).json({ message: 'Missing product_id parameter.' });
    const result = await pool.query(
      `SELECT c.* FROM coupons c
       JOIN product_coupons pc ON c.id = pc.coupon_id
       WHERE pc.product_id = $1`, 
      [product_id]
    );
    return res.status(200).json({ coupons: result.rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
}


exports.getCouponsForVariantsBasedOnProduct = async (req, res) => {
  try {
    const { product_id } = req.params;
    if (!product_id) return res.status(400).json({ message: 'Missing product_id parameter.' });
    const result = await pool.query(
      `SELECT c.* FROM coupons c
       JOIN product_coupons pc ON c.id = pc.coupon_id
       JOIN product_variants pv ON pc.product_id = pv.product_id
        WHERE pv.product_id = $1`,
      [product_id]
    );
    return res.status(200).json({ coupons: result.rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
} 

exports.deleteCoupon = async (req, res) => {
  try {
    const { coupon_id } = req.params;
    if (!coupon_id) return res.status(400).json({ message: 'Missing coupon_id parameter.' });
    const couponRes = await pool.query('SELECT * FROM coupons WHERE id = $1', [coupon_id]);
    if (couponRes.rows.length === 0) return res.status(404).json({ message: 'Coupon not found.' });
    await pool.query('DELETE FROM product_coupons WHERE coupon_id = $1', [coupon_id]);
    await pool.query('DELETE FROM coupons WHERE id = $1', [coupon_id]);
    return res.status(200).json({ message: 'Coupon deleted successfully.' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error.', details: error.message });
  }
}