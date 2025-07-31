const pool = require('../config/db');
module.exports = {
  create: async (req, res) => {
    try {
      const { business_id, name, description } = req.body;
      if (!business_id || !name) return res.status(400).json({ message: 'business_id and name are required.' });
      const result = await pool.query(
        'INSERT INTO expense_categories (business_id, name, description) VALUES ($1, $2, $3) RETURNING *',
        [business_id, name, description || null]
      );
      res.status(201).json({ category: result.rows[0] });
    } catch (err) {
      console.error('Create expense category error:', err);
      res.status(500).json({ message: 'Failed to create expense category.' });
    }
  },
  list: async (req, res) => {
    try {
      const business_id = req.query.business_id;
      const result = await pool.query(
        business_id ? 'SELECT * FROM expense_categories WHERE business_id = $1 ORDER BY created_at DESC' : 'SELECT * FROM expense_categories ORDER BY created_at DESC',
        business_id ? [business_id] : []
      );
      res.json({ categories: result.rows });
    } catch (err) {
      console.error('List expense categories error:', err);
      res.status(500).json({ message: 'Failed to list expense categories.' });
    }
  },
  update: async (req, res) => {
    try {
      const { id } = req.params;
      const { name, description } = req.body;
      if (!name) return res.status(400).json({ message: 'Name is required.' });
      const result = await pool.query(
        'UPDATE expense_categories SET name = $1, description = $2 WHERE id = $3 RETURNING *',
        [name, description || null, id]
      );
      res.json({ category: result.rows[0] });
    } catch (err) {
      console.error('Update expense category error:', err);
      res.status(500).json({ message: 'Failed to update expense category.' });
    }
  },
  delete: async (req, res) => {
    try {
      const { id } = req.params;
      await pool.query('DELETE FROM expense_categories WHERE id = $1', [id]);
      res.json({ message: 'Expense category deleted' });
    } catch (err) {
      console.error('Delete expense category error:', err);
      res.status(500).json({ message: 'Failed to delete expense category.' });
    }
  },
};
