
const Bull = require('bull');
const pool = require('../config/db');
const { io, userSockets } = require('../realtime');
const { sendNotificationEmail } = require('../services/emailService');


const reportQueue = new Bull('report-generation', { redis: { host: process.env.REDIS_HOST || '127.0.0.1', port: process.env.REDIS_PORT || 6379 } });
const emailQueue = new Bull('email-sending', { redis: { host: process.env.REDIS_HOST || '127.0.0.1', port: process.env.REDIS_PORT || 6379 } });
const stockCheckQueue = new Bull('stock-check', { redis: { host: process.env.REDIS_HOST || '127.0.0.1', port: process.env.REDIS_PORT || 6379 } });


reportQueue.process(async (job) => {
 
  console.log('Generating report:', job.data);
  
});


emailQueue.process(async (job) => {
 
  console.log('Sending email:', job.data);
 
});


stockCheckQueue.process(async (job) => {

  console.log('Running stock check:', job.data);
  
  const { userId, businessId, productName, email } = job.data;
  const type = 'low_stock';
  const message = `Product ${productName} is low in stock!`;

  const result = await pool.query(
    'INSERT INTO notifications (user_id, business_id, type, message) VALUES ($1, $2, $3, $4) RETURNING *',
    [userId, businessId, type, message]
  );

  const socketId = userSockets.get(String(userId));
  if (socketId) {
    io.to(socketId).emit('notification', result.rows[0]);
  }
 
  if (email) {
    await sendNotificationEmail(email, `Qodebook Notification: ${type}`, message);
  }
});


function scheduleStockCheck() {

  stockCheckQueue.add({ userId: 1, businessId: 1, productName: 'Sample Product', email: 'user@example.com' }, { repeat: { cron: '0 0 * * *' } });
}

module.exports = {
  start: () => {
    console.log('Job queues started (Bull)');
    scheduleStockCheck();
  },
  reportQueue,
  emailQueue,
  stockCheckQueue,
};
