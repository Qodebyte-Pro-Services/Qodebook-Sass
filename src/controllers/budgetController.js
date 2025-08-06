const pool = require('../config/db');
module.exports = {
 
  create: async (req, res) => {
    try {
      const { business_id, category_id, amount, period, start_date, end_date } = req.body;
      if (!business_id || !category_id || !amount || !period || !start_date || !end_date) {
        return res.status(400).json({ message: 'All fields are required.' });
      }
    
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

  approve: async (req, res) => {
    try {
      const { id } = req.params;
      const result = await pool.query(
        `UPDATE budgets 
         SET status = 'approved', rejection_reason = NULL 
         WHERE id = $1 AND status = 'pending' 
         RETURNING *`,
        [id]
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Pending budget not found or already processed.' });
      }
      res.json({ message: 'Budget approved.', budget: result.rows[0] });
    } catch (err) {
      console.error('Approve budget error:', err);
      res.status(500).json({ message: 'Failed to approve budget.' });
    }
  },

  reject: async (req, res) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      if (!reason) {
        return res.status(400).json({ message: 'Rejection reason is required.' });
      }
      const result = await pool.query(
        `UPDATE budgets 
         SET status = 'rejected', rejection_reason = $2 
         WHERE id = $1 AND status = 'pending' 
         RETURNING *`,
        [id, reason]
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Pending budget not found or already processed.' });
      }
      res.json({ message: 'Budget rejected.', budget: result.rows[0] });
    } catch (err) {
      console.error('Reject budget error:', err);
      res.status(500).json({ message: 'Failed to reject budget.' });
    }
  },
  
  

  remaining: async (req, res) => {
    try {
      const { category_id } = req.params;
      const { business_id } = req.query;
      if (!business_id) {
        return res.status(400).json({ message: 'business_id is required' });
      }
  
      const budgetsResult = await pool.query(
        'SELECT SUM(amount) AS total_budget FROM budgets WHERE business_id = $1 AND category_id = $2',
        [business_id, category_id]
      );
      const totalBudget = Number(budgetsResult.rows[0]?.total_budget || 0);
    
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
      const { business_id, status } = req.query;
      const filters = [];
const params = [];

if (business_id) {
  filters.push('business_id = $' + (params.length + 1));
  params.push(business_id);
}

if (status) {
  filters.push('status = $' + (params.length + 1));
  params.push(status);
}

const whereClause = filters.length ? `WHERE ${filters.join(' AND ')}` : '';
const result = await pool.query(
  `SELECT * FROM budgets ${whereClause} ORDER BY created_at DESC`,
  params
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
