
const pool = require('../config/db');
// const uploadToFirebase = require('../utils/uploadToFireBase');
const uploadToCloudinary = require('../utils/uploadToCloudinary');

exports.countProductsInStock = async (req, res) => {
  try {
    const { business_id, branch_id } = req.query;
    let query = 'SELECT COUNT(*) FROM products';
    let params = [];
    if (business_id) {
      query += ' WHERE business_id = $1';
      params.push(business_id);
      if (branch_id) {
        query += ' AND branch_id = $2';
        params.push(branch_id);
      }
    }
    const result = await pool.query(query, params);
    return res.status(200).json({ count: Number(result.rows[0].count) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

exports.createProduct = async (req, res) => {
  try {
    const { business_id, category_id, name, brand, description, base_sku, taxable, threshold } = req.body;
  let image_url = null;
    if (req.file) {
      image_url = await uploadToCloudinary(req.file);
    } else if (req.body.image_url) {
      image_url = req.body.image_url;
    }
    if (!business_id || !category_id || !name) return res.status(400).json({ message: 'business_id, category_id, and name are required.' });
    const check = await pool.query('SELECT * FROM products WHERE business_id = $1 AND LOWER(name) = LOWER($2)', [business_id, name]);
    if (check.rows.length > 0) return res.status(409).json({ message: 'Product name already exists.' });
    const result = await pool.query(
      'INSERT INTO products (business_id, category_id, name, brand, description, base_sku, image_url, taxable, threshold) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
      [business_id, category_id, name, brand, description, base_sku, image_url, taxable, threshold]
    );
    return res.status(201).json({ message: 'Product created.', product: result.rows[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

exports.listProducts = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM products');
    return res.status(200).json({ products: result.rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

exports.getProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM products WHERE id = $1', [id]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Product not found.' });
    return res.status(200).json({ product: result.rows[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, brand, description, base_sku, taxable, threshold, category_id } = req.body;
      let image_url = null;
    if (req.file) {
      image_url = await uploadToCloudinary(req.file);
    } else if (req.body.image_url) {
      image_url = req.body.image_url;
    }

    let setParts = [];
    let values = [];
    let idx = 1;
    if (name) { setParts.push('name = $' + idx); values.push(name); idx++; }
    if (brand) { setParts.push('brand = $' + idx); values.push(brand); idx++; }
    if (description) { setParts.push('description = $' + idx); values.push(description); idx++; }
    if (base_sku) { setParts.push('base_sku = $' + idx); values.push(base_sku); idx++; }
    if (image_url) { setParts.push('image_url = $' + idx); values.push(image_url); idx++; }
    if (taxable !== undefined) { setParts.push('taxable = $' + idx); values.push(taxable); idx++; }
    if (threshold !== undefined) { setParts.push('threshold = $' + idx); values.push(threshold); idx++; }
    if (category_id) { setParts.push('category_id = $' + idx); values.push(category_id); idx++; }
    setParts.push('updated_at = NOW()');
    if (setParts.length === 1) return res.status(400).json({ message: 'No fields to update.' });
    values.push(id);
    const setClause = setParts.join(', ');
    const query = 'UPDATE products SET ' + setClause + ' WHERE id = $' + idx + ' RETURNING *';
    const result = await pool.query(query, values);
    return res.status(200).json({ message: 'Product updated.', product: result.rows[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM products WHERE id = $1', [id]);
    return res.status(200).json({ message: 'Product deleted.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

exports.getProductsByCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM products WHERE category_id = $1', [id]);
    return res.status(200).json({ products: result.rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

exports.getProductsByBusiness = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM products WHERE business_id = $1', [id]);
    return res.status(200).json({ products: result.rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};
