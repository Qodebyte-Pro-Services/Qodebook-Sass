const pool = require('../config/db');
const { sendInstallmentReminderToCustomer, sendInstallmentReminderToOwner } = require('../services/emailService');
const pLimit = require('p-limit');

const CRON_LOCK_KEY = 123456;
const BATCH_SIZE = 500;
const MAX_LOGGED_FAILURES = 100;
const MAX_ATTEMPTS_PER_DAY = 3;

async function sendInstallmentReminders() {
  const client = await pool.connect();
  try {
    const { rows: lockRows } = await client.query(
      'SELECT pg_try_advisory_lock($1) AS locked',
      [CRON_LOCK_KEY]
    );

    if (!lockRows[0].locked) {
      console.log('⏭️ Another reminder job is already running. Skipping this run.');
      return;
    }

    let lastSeenId = 0;
    let totalSucceeded = 0;
    let totalFailed = 0;
    const allFailedEmails = [];

    const limit = pLimit(10);

    while (true) {
      const remindersRes = await client.query(`
        SELECT  
          ip.id AS installment_id,
          ip.amount,
          ip.due_date,
          c.name AS customer_name,
          c.email AS customer_email,
          c.phone AS customer_phone,
          b.business_name,
          u.email AS owner_email,
          u.first_name AS owner_first_name,
          u.last_name AS owner_last_name
        FROM installment_payments ip
        JOIN installment_plans plan ON ip.installment_plan_id = plan.id
        JOIN customers c ON plan.customer_id = c.id
        JOIN businesses b ON plan.business_id = b.id
        JOIN users u ON b.user_id = u.id
        WHERE ip.status = 'pending'
          AND (ip.due_date = CURRENT_DATE OR ip.due_date = CURRENT_DATE + INTERVAL '1 day')
          -- Not yet successfully reminded today
          AND (
            ip.last_reminder_sent_at IS NULL
            OR ip.last_reminder_sent_at < CURRENT_DATE
          )
          -- Not attempted in the last hour — allows retrying failures
          -- without re-sending on every cron tick
          AND (
            ip.last_reminder_attempted_at IS NULL
            OR ip.last_reminder_attempted_at < NOW() - INTERVAL '1 hour'
          )
          -- Cap retries to avoid hammering providers during outages
          AND (
            ip.reminder_attempt_count IS NULL
            OR ip.reminder_attempt_count < $3
          )
          AND ip.id > $1
        ORDER BY ip.id
        LIMIT $2
      `, [lastSeenId, BATCH_SIZE, MAX_ATTEMPTS_PER_DAY]);

      const rows = remindersRes.rows;

      if (rows.length === 0) {
        if (lastSeenId === 0) {
          console.log("🕒 No installments nearing due date today.");
        }
        break;
      }

      console.log(`🕒 Processing batch of ${rows.length} installments (after id ${lastSeenId})...`);

      const installmentPromises = rows.map(row => {
        const {
          installment_id,
          amount,
          due_date,
          customer_name,
          customer_email,
          customer_phone,
          business_name,
          owner_email,
          owner_first_name,
          owner_last_name
        } = row;

        const data = {
          customerName: customer_name,
          customerPhone: customer_phone,
          customerEmail: customer_email,
          amount,
          dueDate: due_date,
          businessName: business_name,
          ownerName: `${owner_first_name} ${owner_last_name}`.trim()
        };

        return limit(async () => {
          const attempts = [];

          if (customer_email) {
            attempts.push(
              sendInstallmentReminderToCustomer(customer_email, data)
                .then(() => ({ success: true, email: customer_email }))
                .catch(err => {
                  console.error(`Failed to send email (installment ${installment_id}) to customer ${customer_email}:`, err.message);
                  return { success: false, email: customer_email };
                })
            );
          }

          if (owner_email) {
            attempts.push(
              sendInstallmentReminderToOwner(owner_email, data)
                .then(() => ({ success: true, email: owner_email }))
                .catch(err => {
                  console.error(`Failed to send email (installment ${installment_id}) to owner ${owner_email}:`, err.message);
                  return { success: false, email: owner_email };
                })
            );
          }

          if (attempts.length === 0) {
            console.warn(`⚠️ No email address found for installment ${installment_id} — skipping.`);
            return { installment_id, results: [], anySucceeded: false };
          }

          const results = await Promise.all(attempts);
          const anySucceeded = results.some(r => r.success);

          return { installment_id, results, anySucceeded };
        });
      });

      const allResults = await Promise.all(installmentPromises);

      // --- All DB writes go through client to stay on the locked session ---

      // Batch-mark every attempted row in one query — same pattern as sent update.
      // Increment attempt counter so MAX_ATTEMPTS_PER_DAY cap is enforced.
      // Reset counter to 0 at the start of each day via the CASE expression.
      const attemptedIds = allResults.map(r => r.installment_id);
      await client.query(
        `UPDATE installment_payments
         SET
           last_reminder_attempted_at = NOW(),
           reminder_attempt_count = CASE
             WHEN last_reminder_attempted_at IS NULL
               OR last_reminder_attempted_at < CURRENT_DATE
             THEN 1
             ELSE reminder_attempt_count + 1
           END
         WHERE id = ANY($1::int[])`,
        [attemptedIds]
      );

      // Batch-mark successes — idempotent guard prevents double-writes
      const successfulInstallmentIds = [...new Set(
        allResults
          .filter(r => r.anySucceeded)
          .map(r => r.installment_id)
      )];

      if (successfulInstallmentIds.length > 0) {
        await client.query(
          `UPDATE installment_payments
           SET last_reminder_sent_at = NOW()
           WHERE id = ANY($1::int[])
             AND (
               last_reminder_sent_at IS NULL
               OR last_reminder_sent_at < CURRENT_DATE
             )`,
          [successfulInstallmentIds]
        );
      }

      const allAttempts = allResults.flatMap(r => r.results);
      const batchFailed = allAttempts.filter(r => !r.success);

      totalSucceeded += allAttempts.filter(r => r.success).length;
      totalFailed += batchFailed.length;

      const remainingCapacity = MAX_LOGGED_FAILURES - allFailedEmails.length;
      if (remainingCapacity > 0) {
        allFailedEmails.push(...batchFailed.slice(0, remainingCapacity).map(r => r.email));
      }

      lastSeenId = rows[rows.length - 1].installment_id;
      if (rows.length < BATCH_SIZE) break;
    }

    console.log(`✅ ${totalSucceeded} reminder(s) sent successfully.`);
    if (totalFailed > 0) {
      const truncated = totalFailed > MAX_LOGGED_FAILURES;
      console.warn(
        `⚠️ ${totalFailed} reminder(s) failed to send.`,
        `Showing ${allFailedEmails.length}${truncated ? ` of ${totalFailed}` : ''}:`,
        allFailedEmails
      );
    }

  } catch (err) {
    console.error("💥 Installment reminder cron job error:", err);
  } finally {
    await client.query('SELECT pg_advisory_unlock($1)', [CRON_LOCK_KEY]).catch(() => {});
    client.release();
  }
}

module.exports = {
  sendInstallmentReminders,
};