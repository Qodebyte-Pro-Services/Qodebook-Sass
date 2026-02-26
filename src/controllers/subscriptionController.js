
const pool = require('../config/db');

module.exports = {
 
  subscribe: async (req, res) => {
    try {
      const userId = req.user.id;
      const { plan, amount, duration } = req.body; 
      if (!plan || !amount || !duration) {
        return res.status(400).json({ message: 'plan, amount, and duration are required' });
      }
     
      const startDate = new Date();
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + parseInt(duration));
      
      const result = await pool.query(
        'INSERT INTO subscriptions (user_id, plan, amount, start_date, end_date, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
        [userId, plan, amount, startDate, endDate, 'active']
      );
     
      res.status(201).json({ subscription: result.rows[0] });
    } catch (err) {
      console.error('Subscription error:');
      res.status(500).json({ message: 'Failed to subscribe' });
    }
  },

 
  status: async (req, res) => {
    try {
      const userId = req.user.id;
      const result = await pool.query(
        'SELECT * FROM subscriptions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1',
        [userId]
      );
      if (result.rows.length === 0) {
        return res.json({ status: 'none', plan: null, expires: null });
      }
      const sub = result.rows[0];
      res.json({ status: sub.status, plan: sub.plan, expires: sub.end_date });
    } catch (err) {
      console.error('Status error:');
      res.status(500).json({ message: 'Failed to fetch subscription status' });
    }
  },


  cancel: async (req, res) => {
    try {
      const userId = req.user.id;
     
      const result = await pool.query(
        'UPDATE subscriptions SET status = $1 WHERE user_id = $2 AND status = $3 RETURNING *',
        ['cancelled', userId, 'active']
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'No active subscription found' });
      }
      res.json({ message: 'Subscription cancelled', subscription: result.rows[0] });
    } catch (err) {
      console.error('Cancel error:');
      res.status(500).json({ message: 'Failed to cancel subscription' });
    }
  },
};
