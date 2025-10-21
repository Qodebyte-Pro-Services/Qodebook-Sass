const { unlink } = require('fs');
const pool = require('../config/db');

exports.createCoupon = async (req, res) => {
  try {
    const { business_id, code, coupons_type, description, discount_percentage, discount_amount, start_date, end_date, usage_limit } = req.body;
    if (!business_id || !code || !coupons_type) return res.status(400).json({ message: 'Missing required fields.' });
    if (!['fixed-amount', 'percentage'].includes(coupons_type)) {
      return res.status(400).json({ message: 'Invalid coupon type.' });
    }
    const coupon_percentage = discount_percentage || 0;
    const coupon_amount = discount_amount || 0;
    const result = await pool.query('INSERT INTO coupons (business_id, code, coupons_type, description, discount_percentage, discount_amount, start_date, end_date, usage_limit) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *', [business_id, code, coupons_type, description, coupon_percentage, coupon_amount, start_date, end_date, usage_limit]);
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

exports.unlinkCouponFromProducts = async (req, res) => {
  try {
    const { coupon_id } = req.params;
    if (!coupon_id) {
      return res.status(400).json({ message: 'Missing required field: coupon_id.' });
    }
    const check = await pool.query(
      'SELECT * FROM product_coupons WHERE coupon_id = $1',
      [coupon_id]
    );
    if (check.rows.length === 0) {
      return res.status(404).json({ message: 'No products are linked to this coupon.' });
    }
    await pool.query('DELETE FROM product_coupons WHERE coupon_id = $1', [coupon_id]);
    return res.status(200).json({ message: 'Coupon unlinked from products successfully.', unlinked_count: check.rows.length });
  } catch (error) {
    console.error('Error unlinking coupon from products:', error);
    return res.status(500).json({ message: 'Server error.', error: error.message });
  }
}

exports.unlinkCouponFromProduct = async (req, res) => {
  try {
    const { product_id, coupon_id } = req.params;
    if (!product_id || !coupon_id) return res.status(400).json({ message: 'Missing required fields.' });
    const check = await pool.query(
      'SELECT * FROM product_coupons WHERE product_id = $1 AND coupon_id = $2',
      [product_id, coupon_id]
    );
    if (check.rows.length === 0) {
      return res.status(404).json({ message: 'This coupon is not linked to the specified product.' });
    }
    await pool.query('DELETE FROM product_coupons WHERE product_id = $1 AND coupon_id = $2', [product_id, coupon_id]);
    return res.status(200).json({ message: 'Coupon unlinked from product successfully.' });
  } catch (error) {
    console.error('Error unlinking coupon from product:', error);
    return res.status(500).json({ message: 'Server error.', error: error.message });
  }
}

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

  exports.updateCoupon = async (req, res) => {
    try {
      const { coupon_id } = req.params;
      const { code, description, discount_percentage, discount_amount, start_date, end_date, usage_limit } = req.body;
      if (!coupon_id) return res.status(400).json({ message: 'Missing coupon_id parameter.' });
      const couponRes = await pool.query('SELECT * FROM coupons WHERE id = $1', [coupon_id]);
      if (couponRes.rows.length === 0) return res.status(404).json({ message: 'Coupon not found.' });
      const updatedCoupon = {
        code: code || couponRes.rows[0].code,
        description: description || couponRes.rows[0].description,
        discount_percentage: discount_percentage !== undefined ? discount_percentage : couponRes.rows[0].discount_percentage,
        discount_amount: discount_amount !== undefined ? discount_amount : couponRes.rows[0].discount_amount,
        start_date: start_date || couponRes.rows[0].start_date,
        end_date: end_date || couponRes.rows[0].end_date,
        usage_limit: usage_limit !== undefined ? usage_limit : couponRes.rows[0].usage_limit,
      };
      const result = await pool.query(
        `UPDATE coupons SET code = $1, description = $2, discount_percentage = $3, discount_amount = $4, start_date = $5, end_date = $6, usage_limit = $7 WHERE id = $8 RETURNING *`,
        [updatedCoupon.code, updatedCoupon.description, updatedCoupon.discount_percentage, updatedCoupon.discount_amount, updatedCoupon.start_date, updatedCoupon.end_date, updatedCoupon.usage_limit, coupon_id]
      );
      return res.status(200).json({ coupon: result.rows[0] });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Server error.', details: error.message });
    }
  }