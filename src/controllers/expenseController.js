const pool = require('../config/db');
const upload = require('../middlewares/upload');
const { io, userSockets } = require('../realtime');
// const uploadToFirebase = require('../utils/uploadToFireBase');
const uploadToCloudinary = require('../utils/uploadToCloudinary');


module.exports = {

  create: async (req, res) => {
    try {
      const { business_id, category_id, staff_id, amount, description, expense_date } = req.body;
      let receipt_url = null;
      if (req.file) {
      
        receipt_url = await uploadToCloudinary(req.file);
      }
      if (!business_id || !category_id || !amount || !expense_date) {
        return res.status(400).json({ message: 'business_id, category_id, amount, and expense_date are required.' });
      }
      const result = await pool.query(
        'INSERT INTO expenses (business_id, category_id, staff_id, amount, description, expense_date, status, receipt_url) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
        [business_id, category_id, staff_id || null, amount, description || null, expense_date, 'pending', receipt_url]
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
      const status = req.query.status;
      let query = 'SELECT * FROM expenses';
      let params = [];
      if (business_id && status) {
        query += ' WHERE business_id = $1 AND status = $2 ORDER BY expense_date DESC';
        params = [business_id, status];
      } else if (business_id) {
        query += ' WHERE business_id = $1 ORDER BY expense_date DESC';
        params = [business_id];
      } else if (status) {
        query += ' WHERE status = $1 ORDER BY expense_date DESC';
        params = [status];
      } else {
        query += ' ORDER BY expense_date DESC';
      }
      const result = await pool.query(query, params);
      res.json({ expenses: result.rows });
    } catch (err) {
      console.error('List expenses error:', err);
      res.status(500).json({ message: 'Failed to list expenses.' });
    }
  },

  approve: async (req, res) => {
    try {
      const { id } = req.params;
      const approverId = req.user.id;
      const result = await pool.query(
        'UPDATE expenses SET status = $1, approved_by = $2, approved_at = NOW() WHERE id = $3 AND status = $4 RETURNING *',
        ['approved', approverId, id, 'pending']
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Expense not found or not pending.' });
      }
      const staffId = result.rows[0].staff_id;
      const socketId = userSockets.get(String(staffId));
      if (socketId) {
        io.to(socketId).emit('notification', { type: 'expense_approved', expense: result.rows[0] });
      }
      res.json({ expense: result.rows[0] });
    } catch (err) {
      console.error('Approve expense error:', err);
      res.status(500).json({ message: 'Failed to approve expense.' });
    }
  },

  reject: async (req, res) => {
    try {
      const { id } = req.params;
      const approverId = req.user.id;
      
      const result = await pool.query(
        'UPDATE expenses SET status = $1, approved_by = $2, approved_at = NOW() WHERE id = $3 AND status = $4 RETURNING *',
        ['rejected', approverId, id, 'pending']
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Expense not found or not pending.' });
      }

      const staffId = result.rows[0].staff_id;
      const socketId = userSockets.get(String(staffId));
      if (socketId) {
        io.to(socketId).emit('notification', { type: 'expense_rejected', expense: result.rows[0] });
      }
      res.json({ expense: result.rows[0] });
    } catch (err) {
      console.error('Reject expense error:', err);
      res.status(500).json({ message: 'Failed to reject expense.' });
    }
  },
  update: async (req, res) => {
    try {
      const { id } = req.params;
      const fields = ['category_id', 'staff_id', 'amount', 'description', 'expense_date'];
      const updates = [];
      const values = [];
      fields.forEach((field, idx) => {
        if (req.body[field] !== undefined) {
          updates.push(`${field} = $${updates.length + 1}`);
          values.push(req.body[field]);
        }
      });
      if (req.file) {
        updates.push(`receipt_url = $${updates.length + 1}`);

        values.push(await uploadToCloudinary(req.file));
      }
      if (updates.length === 0) {
        return res.status(400).json({ message: 'No fields to update.' });
      }
      values.push(id);
      const result = await pool.query(
        `UPDATE expenses SET ${updates.join(', ')} WHERE id = $${values.length} RETURNING *`,
        values
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
