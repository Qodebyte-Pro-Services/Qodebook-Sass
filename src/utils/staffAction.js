const { v4: uuidv4 } = require('uuid');
const pool = require('../config/db');
async function logStaffAction({
  business_id,
  staff_id,
  action_type,
  action_value = null,
  reason = null,
  performed_by = 'system',
  performed_by_role = 'system',
  client = null
}) {
  const id = uuidv4();
  const query = `
    INSERT INTO staff_actions (
      id, business_id, staff_id, action_type, action_value, reason, performed_by, performed_by_role
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
  `;
  const values = [id, business_id, staff_id, action_type, action_value, reason, performed_by, performed_by_role];

  const executor = client || pool;
 try {
   await executor.query(query, values);
 } catch (err) {
    console.error('Error logging staff action:', err);
 }
}

module.exports = { logStaffAction };