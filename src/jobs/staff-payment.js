const pool = require('../config/db');
const { logStaffAction } = require('../utils/staffAction');


async function updateStaffPaymentStatus() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    
    const businessesRes = await client.query(`
      SELECT DISTINCT business_id
      FROM staff
    `);

    for (const { business_id } of businessesRes.rows) {
     
      const staffToUpdate = await client.query(
        `
        SELECT staff_id
        FROM staff
        WHERE business_id = $1
          AND payment_status != 'un_paid'
          AND (last_payment_date IS NULL OR last_payment_date <= CURRENT_DATE - INTERVAL '30 days')
        `,
        [business_id]
      );

      if (staffToUpdate.rowCount === 0) continue;

      
      await client.query(
        `
        UPDATE staff
        SET payment_status = 'un_paid'
        WHERE business_id = $1
          AND payment_status != 'un_paid'
          AND (last_payment_date IS NULL OR last_payment_date <= CURRENT_DATE - INTERVAL '30 days')
        `,
        [business_id]
      );

     
      for (const { staff_id } of staffToUpdate.rows) {
        await logStaffAction({
          business_id,
          staff_id,
          action_type: "status_change",
          reason: "Automatically marked as unpaid after 30 days with no salary payment",
          performed_by: "system",
          performed_by_role: "system",
          client,
        });
      }
    }

    await client.query("COMMIT");
    console.log("✅ Staff payment statuses updated and logged successfully.");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("💥 Cron job error:", err);
  } finally {
    client.release();
  }
}

module.exports = {
  updateStaffPaymentStatus,
};