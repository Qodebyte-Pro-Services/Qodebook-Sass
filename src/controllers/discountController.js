const pool = require('../config/db');

exports.createDiscount = async (req, res) => {
  try {
    const { business_id, name, percentage, discount_type, amount, start_date, end_date, description } = req.body;
    if (!business_id || !name || !discount_type) return res.status(400).json({ message: 'Missing required fields.' });

      if (!['fixed-amount', 'percentage'].includes(discount_type)) {
      return res.status(400).json({ message: 'Invalid discount type.' });
    }

     const discountPercentage = percentage || 0;
    const discountAmount = amount || 0;


      const result = await pool.query(
      `INSERT INTO discounts 
        (business_id, name, percentage, discount_type, amount, start_date, end_date, description) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
       RETURNING *`,
      [business_id, name, discountPercentage, discount_type, discountAmount, start_date, end_date, description]
    );

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

exports.getListOfProductsAndTheirDiscounts = async (req, res) =>  {
  try {
    const { business_id } = req.query;
    if (!business_id) return res.status(400).json({ message: 'Missing business_id parameter.' });
    const result = await pool.query(
      `SELECT p.id AS product_id, p.name AS product_name, d.id AS discount_id, d.name AS discount_name, d.percentage, d.amount, d.start_date, d.end_date, d.description
        FROM products p
        LEFT JOIN product_discounts pd ON p.id = pd.product_id
        LEFT JOIN discounts d ON pd.discount_id = d.id
        WHERE p.business_id = $1`,
      [business_id]
    );
    return res.status(200).json({ products_with_discounts: result.rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
}

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

exports.deleteDiscount = async (req, res) => {
  try {
    const { discount_id } = req.params;
    if (!discount_id) return res.status(400).json({ message: 'Missing discount_id parameter.' });


    const discountRes = await pool.query('SELECT * FROM discounts WHERE id = $1', [discount_id]);
    if (discountRes.rows.length === 0) {
      return res.status(404).json({ message: 'Discount not found.' });
    } 
    await pool.query('DELETE FROM product_discounts WHERE discount_id = $1', [discount_id]);

    await pool.query('DELETE FROM discounts WHERE id = $1', [discount_id]);
    
    return res.status(200).json({ message: 'Discount deleted successfully.' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error.' });
  }
}

exports.updateDiscount = async (req, res) => {
  try {
    const { discount_id } = req.params;
    const { name, percentage, amount, start_date, end_date, description } = req.body;
    if (!discount_id) return res.status(400).json({ message: 'Missing discount_id parameter.' });
    const discountRes = await pool.query('SELECT * FROM discounts WHERE id = $1', [discount_id]);
    if (discountRes.rows.length === 0) return res.status(404).json({ message: 'Discount not found.' });
    const updatedDiscount = {
      name: name || discountRes.rows[0].name,
      percentage: percentage || discountRes.rows[0].percentage,
      amount: amount || discountRes.rows[0].amount,
      start_date: start_date || discountRes.rows[0].start_date,
      end_date: end_date || discountRes.rows[0].end_date,
      description: description || discountRes.rows[0].description,
    };
    await pool.query('UPDATE discounts SET name = $1, percentage = $2, amount = $3, start_date = $4, end_date = $5, description = $6 WHERE id = $7', 
      [updatedDiscount.name, updatedDiscount.percentage, updatedDiscount.amount, updatedDiscount.start_date, updatedDiscount.end_date, updatedDiscount.description, discount_id]);
    return res.status(200).json({ discount: { id: discount_id, ...updatedDiscount } });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error.', details: error.message });
  }
}
