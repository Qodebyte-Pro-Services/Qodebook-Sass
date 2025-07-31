const pool = require('../config/db');
module.exports = {
  create: async (req, res) => {
    try {
      const { business_id, category_id, staff_id, amount, description, expense_date } = req.body;
      if (!business_id || !category_id || !amount || !expense_date) {
        return res.status(400).json({ message: 'business_id, category_id, amount, and expense_date are required.' });
      }
      const result = await pool.query(
        'INSERT INTO expenses (business_id, category_id, staff_id, amount, description, expense_date) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
        [business_id, category_id, staff_id || null, amount, description || null, expense_date]
      );
      res.status(201).json({ expense: result.rows[0] });
    } catch (err) {
      console.error('Create expense error:', err);
      res.status(500).json({ message: 'Failed to create expense.' });
    }
  },
  list: async (req, res) => {
    try {
      const business_id = req.query.business_id;
      const result = await pool.query(
        business_id ? 'SELECT * FROM expenses WHERE business_id = $1 ORDER BY expense_date DESC' : 'SELECT * FROM expenses ORDER BY expense_date DESC',
        business_id ? [business_id] : []
      );
      res.json({ expenses: result.rows });
    } catch (err) {
      console.error('List expenses error:', err);
      res.status(500).json({ message: 'Failed to list expenses.' });
    }
  },
  update: async (req, res) => {
    try {
      const { id } = req.params;
      const { category_id, staff_id, amount, description, expense_date } = req.body;
      if (!category_id || !amount || !expense_date) {
        return res.status(400).json({ message: 'category_id, amount, and expense_date are required.' });
      }
      const result = await pool.query(
        'UPDATE expenses SET category_id = $1, staff_id = $2, amount = $3, description = $4, expense_date = $5 WHERE id = $6 RETURNING *',
        [category_id, staff_id || null, amount, description || null, expense_date, id]
      );
      res.json({ expense: result.rows[0] });
    } catch (err) {
      console.error('Update expense error:', err);
      res.status(500).json({ message: 'Failed to update expense.' });
    }
  },
  delete: async (req, res) => {
    try {
      const { id } = req.params;
      await pool.query('DELETE FROM expenses WHERE id = $1', [id]);
      res.json({ message: 'Expense deleted' });
    } catch (err) {
      console.error('Delete expense error:', err);
      res.status(500).json({ message: 'Failed to delete expense.' });
    }
  },
};
