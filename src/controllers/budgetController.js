const pool = require('../config/db');
module.exports = {
  // Create a budget with spillover logic
  create: async (req, res) => {
    try {
      const { business_id, category_id, amount, period, start_date, end_date } = req.body;
      if (!business_id || !category_id || !amount || !period || !start_date || !end_date) {
        return res.status(400).json({ message: 'All fields are required.' });
      }
      // Calculate spillover: sum of all previous budgets - sum of all approved expenses
      const prevBudgetsResult = await pool.query(
        'SELECT SUM(amount) AS total_budget FROM budgets WHERE business_id = $1 AND category_id = $2 AND end_date < $3',
        [business_id, category_id, start_date]
      );
      const prevBudget = Number(prevBudgetsResult.rows[0]?.total_budget || 0);
      const prevExpensesResult = await pool.query(
        "SELECT SUM(amount) AS total_expense FROM expenses WHERE business_id = $1 AND category_id = $2 AND status = 'approved' AND expense_date < $3",
        [business_id, category_id, start_date]
      );
      const prevExpense = Number(prevExpensesResult.rows[0]?.total_expense || 0);
      const spillover = Math.max(prevBudget - prevExpense, 0);
      // Add spillover to new budget
      const totalBudget = Number(amount) + spillover;
      const result = await pool.query(
        'INSERT INTO budgets (business_id, category_id, amount, period, start_date, end_date) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
        [business_id, category_id, totalBudget, period, start_date, end_date]
      );
      res.status(201).json({ budget: result.rows[0], spillover });
    } catch (err) {
      console.error('Create budget error:', err);
      res.status(500).json({ message: 'Failed to create budget.' });
    }
  },
  // Get remaining budget for a category (including spillover)
  remaining: async (req, res) => {
    try {
      const { category_id } = req.params;
      const { business_id } = req.query;
      if (!business_id) {
        return res.status(400).json({ message: 'business_id is required' });
      }
      // Sum all budgets for this business/category
      const budgetsResult = await pool.query(
        'SELECT SUM(amount) AS total_budget FROM budgets WHERE business_id = $1 AND category_id = $2',
        [business_id, category_id]
      );
      const totalBudget = Number(budgetsResult.rows[0]?.total_budget || 0);
      // Sum all approved expenses for this business/category
      const expensesResult = await pool.query(
        "SELECT SUM(amount) AS total_expense FROM expenses WHERE business_id = $1 AND category_id = $2 AND status = 'approved'",
        [business_id, category_id]
      );
      const totalExpense = Number(expensesResult.rows[0]?.total_expense || 0);
      const remaining = totalBudget - totalExpense;
      res.json({ remaining, totalBudget, totalExpense });
    } catch (err) {
      console.error('Get remaining budget error:', err);
      res.status(500).json({ message: 'Failed to get remaining budget.' });
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
