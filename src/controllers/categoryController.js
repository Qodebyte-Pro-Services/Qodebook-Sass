const pool = require('../config/db');

exports.createCategory = async (req, res) => {
  try {
    const { business_id, name, description } = req.body;
    if (!business_id || !name) return res.status(400).json({ message: 'business_id and name are required.' });
   
    const check = await pool.query('SELECT * FROM categories WHERE business_id = $1 AND LOWER(name) = LOWER($2)', [business_id, name]);
    if (check.rows.length > 0) return res.status(409).json({ message: 'Category name already exists.' });
    const result = await pool.query('INSERT INTO categories (business_id, name, description) VALUES ($1, $2, $3) RETURNING *', [business_id, name, description]);
    return res.status(201).json({ message: 'Category created.', category: result.rows[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

exports.listCategories = async (req, res) => {
  try {
    const { business_id } = req.query;
    let result;
    if (business_id) {
      result = await pool.query('SELECT * FROM categories WHERE business_id = $1', [business_id]);
    } else {
      result = await pool.query('SELECT * FROM categories');
    }
    return res.status(200).json({ categories: result.rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    if (!name && !description) return res.status(400).json({ message: 'No fields to update.' });

    if (name) {
      const check = await pool.query('SELECT * FROM categories WHERE LOWER(name) = LOWER($1) AND id != $2', [name, id]);
      if (check.rows.length > 0) return res.status(409).json({ message: 'Category name already exists.' });
    }
    let setParts = [];
    let values = [];
    let idx = 1;
    if (name) { setParts.push('name = $' + idx); values.push(name); idx++; }
    if (description) { setParts.push('description = $' + idx); values.push(description); idx++; }
    setParts.push('updated_at = NOW()');
    values.push(id);
    const setClause = setParts.join(', ');
    const query = 'UPDATE categories SET ' + setClause + ' WHERE id = $' + idx + ' RETURNING *';
    const result = await pool.query(query, values);
    return res.status(200).json({ message: 'Category updated.', category: result.rows[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM categories WHERE id = $1', [id]);
    return res.status(200).json({ message: 'Category deleted.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

exports.getCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM categories WHERE id = $1', [id]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Category not found.' });
    return res.status(200).json({ category: result.rows[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

exports.getCategoriesByBusiness = async (req, res) => {
  try {
    const { business_id } = req.params;
    const result = await pool.query('SELECT * FROM categories WHERE business_id = $1', [business_id]);
    return res.status(200).json({ categories: result.rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};
