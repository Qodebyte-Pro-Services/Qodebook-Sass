const pool = require('../config/db');


exports.createAppointment = async (req, res) => {
  try {
    const { business_id, service_id, customer_id, staff_id, appointment_time, status, note } = req.body;
    if (!business_id || !service_id || !appointment_time) return res.status(400).json({ message: 'business_id, service_id, and appointment_time are required.' });
    const result = await pool.query('INSERT INTO appointments (business_id, service_id, customer_id, staff_id, appointment_time, status, note) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *', [business_id, service_id, customer_id, staff_id, appointment_time, status || 'scheduled', note]);
    return res.status(201).json({ appointment: result.rows[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};


exports.listAppointments = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM appointments ORDER BY appointment_time DESC');
    return res.status(200).json({ appointments: result.rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};
