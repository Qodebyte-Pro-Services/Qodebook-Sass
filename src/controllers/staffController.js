
exports.createStaffAction = async (req, res) => {
  try {
    const { id, business_id, staff_id, action_type, action_value, reason, performed_by, performed_by_role } = req.body;
    if (!id || !business_id || !staff_id || !action_type) return res.status(400).json({ message: 'Missing required fields.' });
    const result = await pool.query('INSERT INTO staff_actions (id, business_id, staff_id, action_type, action_value, reason, performed_by, performed_by_role) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *', [id, business_id, staff_id, action_type, action_value, reason, performed_by, performed_by_role]);
    return res.status(201).json({ staff_action: result.rows[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};
exports.listStaffActions = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM staff_actions');
    return res.status(200).json({ staff_actions: result.rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};
exports.updateStaffAction = async (req, res) => {
  try {
    const { id } = req.params;
    const fields = req.body;
    let setParts = [];
    let values = [];
    let idx = 1;
    for (const key in fields) {
      setParts.push(`${key} = $${idx}`);
      values.push(fields[key]);
      idx++;
    }
    if (setParts.length === 0) return res.status(400).json({ message: 'No fields to update.' });
    values.push(id);
    const setClause = setParts.join(', ');
    const query = `UPDATE staff_actions SET ${setClause} WHERE id = $${idx} RETURNING *`;
    const result = await pool.query(query, values);
    return res.status(200).json({ staff_action: result.rows[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};
exports.deleteStaffAction = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM staff_actions WHERE id = $1', [id]);
    return res.status(200).json({ message: 'Staff action deleted.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};


exports.createStaffDoc = async (req, res) => {
  try {
    const { id, business_id, staff_id, document_name, file } = req.body;
    if (!id || !business_id || !staff_id) return res.status(400).json({ message: 'Missing required fields.' });
    const result = await pool.query('INSERT INTO staff_docs (id, business_id, staff_id, document_name, file) VALUES ($1,$2,$3,$4,$5) RETURNING *', [id, business_id, staff_id, document_name, file]);
    return res.status(201).json({ staff_doc: result.rows[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};
exports.listStaffDocs = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM staff_docs');
    return res.status(200).json({ staff_docs: result.rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};
exports.updateStaffDoc = async (req, res) => {
  try {
    const { id } = req.params;
    const fields = req.body;
    let setParts = [];
    let values = [];
    let idx = 1;
    for (const key in fields) {
      setParts.push(`${key} = $${idx}`);
      values.push(fields[key]);
      idx++;
    }
    if (setParts.length === 0) return res.status(400).json({ message: 'No fields to update.' });
    values.push(id);
    const setClause = setParts.join(', ');
    const query = `UPDATE staff_docs SET ${setClause} WHERE id = $${idx} RETURNING *`;
    const result = await pool.query(query, values);
    return res.status(200).json({ staff_doc: result.rows[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};
exports.deleteStaffDoc = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM staff_docs WHERE id = $1', [id]);
    return res.status(200).json({ message: 'Staff doc deleted.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};


exports.createStaffShift = async (req, res) => {
  try {
    const { shift_id, staff_id, business_id, fullname, working_hours, work_days } = req.body;
    if (!shift_id || !staff_id || !business_id || !fullname) return res.status(400).json({ message: 'Missing required fields.' });
    const result = await pool.query('INSERT INTO staff_shifts (shift_id, staff_id, business_id, fullname, working_hours, work_days) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *', [shift_id, staff_id, business_id, fullname, working_hours, work_days]);
    return res.status(201).json({ staff_shift: result.rows[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};
exports.listStaffShifts = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM staff_shifts');
    return res.status(200).json({ staff_shifts: result.rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};
exports.updateStaffShift = async (req, res) => {
  try {
    const { id } = req.params;
    const fields = req.body;
    let setParts = [];
    let values = [];
    let idx = 1;
    for (const key in fields) {
      setParts.push(`${key} = $${idx}`);
      values.push(fields[key]);
      idx++;
    }
    if (setParts.length === 0) return res.status(400).json({ message: 'No fields to update.' });
    values.push(id);
    const setClause = setParts.join(', ');
    const query = `UPDATE staff_shifts SET ${setClause} WHERE shift_id = $${idx} RETURNING *`;
    const result = await pool.query(query, values);
    return res.status(200).json({ staff_shift: result.rows[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};
exports.deleteStaffShift = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM staff_shifts WHERE shift_id = $1', [id]);
    return res.status(200).json({ message: 'Staff shift deleted.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};


exports.createStaffSubcharge = async (req, res) => {
  try {
    const { id, staff_id, sub_charge_amt, reason } = req.body;
    if (!id || !staff_id || !sub_charge_amt) return res.status(400).json({ message: 'Missing required fields.' });
    const result = await pool.query('INSERT INTO staff_subcharges (id, staff_id, sub_charge_amt, reason) VALUES ($1,$2,$3,$4) RETURNING *', [id, staff_id, sub_charge_amt, reason]);
    return res.status(201).json({ staff_subcharge: result.rows[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};
exports.listStaffSubcharges = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM staff_subcharges');
    return res.status(200).json({ staff_subcharges: result.rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};
exports.updateStaffSubcharge = async (req, res) => {
  try {
    const { id } = req.params;
    const fields = req.body;
    let setParts = [];
    let values = [];
    let idx = 1;
    for (const key in fields) {
      setParts.push(`${key} = $${idx}`);
      values.push(fields[key]);
      idx++;
    }
    if (setParts.length === 0) return res.status(400).json({ message: 'No fields to update.' });
    values.push(id);
    const setClause = setParts.join(', ');
    const query = `UPDATE staff_subcharges SET ${setClause} WHERE id = $${idx} RETURNING *`;
    const result = await pool.query(query, values);
    return res.status(200).json({ staff_subcharge: result.rows[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};
exports.deleteStaffSubcharge = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM staff_subcharges WHERE id = $1', [id]);
    return res.status(200).json({ message: 'Staff subcharge deleted.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};
const pool = require('../config/db');


exports.createStaff = async (req, res) => {
  try {
    const { staff_id, business_id, branch_id, full_name, contact_no, email, address, document, position_name, assigned_position, gender, staff_status, date_of_birth, state_of_origin, emergency_contact, employment_type, start_date, salary, bank_account_number, bank_name, national_id, guarantor_name, guarantor_contact, guarantor_relationship, guarantor_address, photo, payment_status, last_payment_date, staff_status_change_reason } = req.body;
    if (!staff_id || !business_id || !branch_id || !full_name || !contact_no || !email || !gender || !staff_status || !payment_status) return res.status(400).json({ message: 'Missing required fields.' });
    const result = await pool.query(`INSERT INTO staff (staff_id, business_id, branch_id, full_name, contact_no, email, address, document, position_name, assigned_position, gender, staff_status, date_of_birth, state_of_origin, emergency_contact, employment_type, start_date, salary, bank_account_number, bank_name, national_id, guarantor_name, guarantor_contact, guarantor_relationship, guarantor_address, photo, payment_status, last_payment_date, staff_status_change_reason) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28) RETURNING *`, [staff_id, business_id, branch_id, full_name, contact_no, email, address, document, position_name, assigned_position, gender, staff_status, date_of_birth, state_of_origin, emergency_contact, employment_type, start_date, salary, bank_account_number, bank_name, national_id, guarantor_name, guarantor_contact, guarantor_relationship, guarantor_address, photo, payment_status, last_payment_date, staff_status_change_reason]);
    return res.status(201).json({ staff: result.rows[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

exports.listStaff = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM staff');
    return res.status(200).json({ staff: result.rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

exports.getStaff = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM staff WHERE staff_id = $1', [id]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Staff not found.' });
    return res.status(200).json({ staff: result.rows[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

exports.updateStaff = async (req, res) => {
  try {
    const { id } = req.params;
    const fields = req.body;
    let setParts = [];
    let values = [];
    let idx = 1;
    for (const key in fields) {
      setParts.push(`${key} = $${idx}`);
      values.push(fields[key]);
      idx++;
    }
    if (setParts.length === 0) return res.status(400).json({ message: 'No fields to update.' });
    values.push(id);
    const setClause = setParts.join(', ');
    const query = `UPDATE staff SET ${setClause} WHERE staff_id = $${idx} RETURNING *`;
    const result = await pool.query(query, values);
    return res.status(200).json({ staff: result.rows[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

exports.deleteStaff = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM staff WHERE staff_id = $1', [id]);
    return res.status(200).json({ message: 'Staff deleted.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};


exports.getStaffByBusiness = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM staff WHERE business_id = $1', [id]);
    return res.status(200).json({ staff: result.rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};


exports.createRole = async (req, res) => {
  try {
    const { role_id, business_id, role_name, permissions, created_by } = req.body;
    if (!role_id || !business_id || !role_name || !permissions || !created_by) return res.status(400).json({ message: 'Missing required fields.' });
    const result = await pool.query('INSERT INTO staff_roles (role_id, business_id, role_name, permissions, created_by) VALUES ($1, $2, $3, $4, $5) RETURNING *', [role_id, business_id, role_name, permissions, created_by]);
    return res.status(201).json({ role: result.rows[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

exports.listRoles = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM staff_roles');
    return res.status(200).json({ roles: result.rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

exports.updateRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role_name, permissions } = req.body;
    let setParts = [];
    let values = [];
    let idx = 1;
    if (role_name) { setParts.push('role_name = $' + idx); values.push(role_name); idx++; }
    if (permissions) { setParts.push('permissions = $' + idx); values.push(permissions); idx++; }
    if (setParts.length === 0) return res.status(400).json({ message: 'No fields to update.' });
    values.push(id);
    const setClause = setParts.join(', ');
    const query = `UPDATE staff_roles SET ${setClause} WHERE role_id = $${idx} RETURNING *`;
    const result = await pool.query(query, values);
    return res.status(200).json({ role: result.rows[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

exports.deleteRole = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM staff_roles WHERE role_id = $1', [id]);
    return res.status(200).json({ message: 'Role deleted.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

