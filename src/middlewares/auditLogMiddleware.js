const pool = require('../config/db');


date = new Date();
module.exports = (action, details = null) => async (req, res, next) => {
  try {
    const business_id = req.business_id || req.body.business_id || null;
    const user_id = req.user?.id || null;
    const staff_id = req.user?.staff_id || null;
    const ip_address = req.ip;
    const user_agent = req.headers['user-agent'];
    await pool.query('INSERT INTO audit_logs (business_id, user_id, staff_id, action, details, ip_address, user_agent, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())', [business_id, user_id, staff_id, action, details, ip_address, user_agent]);
  } catch (err) {
    console.error('Audit log error:', err);
  }
  next();
};
