const pool = require('../config/db');
module.exports = {
  create: async (req, res) => {
    try {
      const { business_id, category_id, amount, period, start_date, end_date } = req.body;
      if (!business_id || !category_id || !amount || !period || !start_date || !end_date) {
        return res.status(400).json({ message: 'All fields are required.' });
      }
      const result = await pool.query(
        'INSERT INTO budgets (business_id, category_id, amount, period, start_date, end_date) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
        [business_id, category_id, amount, period, start_date, end_date]
      );
      res.status(201).json({ budget: result.rows[0] });
    } catch (err) {
      console.error('Create budget error:', err);
      res.status(500).json({ message: 'Failed to create budget.' });
    }
  },
  list: async (req, res) => {
    try {
      const business_id = req.query.business_id;
      const result = await pool.query(
        business_id ? 'SELECT * FROM budgets WHERE business_id = $1 ORDER BY created_at DESC' : 'SELECT * FROM budgets ORDER BY created_at DESC',
        business_id ? [business_id] : []
      );
      res.json({ budgets: result.rows });
    } catch (err) {
      console.error('List budgets error:', err);
      res.status(500).json({ message: 'Failed to list budgets.' });
    }
  },
  update: async (req, res) => {
    try {
      const { id } = req.params;
      const { category_id, amount, period, start_date, end_date } = req.body;
      if (!category_id || !amount || !period || !start_date || !end_date) {
        return res.status(400).json({ message: 'All fields are required.' });
      }
      const result = await pool.query(
        'UPDATE budgets SET category_id = $1, amount = $2, period = $3, start_date = $4, end_date = $5 WHERE id = $6 RETURNING *',
        [category_id, amount, period, start_date, end_date, id]
      );
      res.json({ budget: result.rows[0] });
    } catch (err) {
      console.error('Update budget error:', err);
      res.status(500).json({ message: 'Failed to update budget.' });
    }
  },
  delete: async (req, res) => {
    try {
      const { id } = req.params;
      await pool.query('DELETE FROM budgets WHERE id = $1', [id]);
      res.json({ message: 'Budget deleted' });
    } catch (err) {
      console.error('Delete budget error:', err);
      res.status(500).json({ message: 'Failed to delete budget.' });
    }
  },
};
