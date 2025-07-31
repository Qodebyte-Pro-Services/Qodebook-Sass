const pool = require('../config/db');


exports.assignStaff = async (req, res) => {
  try {
    const { business_id, service_id, staff_id } = req.body;
    if (!business_id || !service_id || !staff_id) return res.status(400).json({ message: 'business_id, service_id, and staff_id are required.' });
    const result = await pool.query('INSERT INTO service_staff_assignments (business_id, service_id, staff_id) VALUES ($1, $2, $3) RETURNING *', [business_id, service_id, staff_id]);
    return res.status(201).json({ assignment: result.rows[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};


exports.listAssignments = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM service_staff_assignments');
    return res.status(200).json({ assignments: result.rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};
