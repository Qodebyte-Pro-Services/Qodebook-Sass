// // jobs/index.js
// // Job queue setup using Bull for background jobs & scheduling
// // const Bull = require('bull');
// // const path = require('path');

// // Example queues
// const reportQueue = new Bull('report-generation', { redis: { host: process.env.REDIS_HOST || '127.0.0.1', port: process.env.REDIS_PORT || 6379 } });
// const emailQueue = new Bull('email-sending', { redis: { host: process.env.REDIS_HOST || '127.0.0.1', port: process.env.REDIS_PORT || 6379 } });
// const stockCheckQueue = new Bull('stock-check', { redis: { host: process.env.REDIS_HOST || '127.0.0.1', port: process.env.REDIS_PORT || 6379 } });

// // Processors
// // reportQueue.process(async (job) => {
// //   // Heavy report generation logic here
// // //   console.log('Generating report:', job.data);
// //   // ...
// // });

// emailQueue.process(async (job) => {
//   // Email sending logic here
//   console.log('Sending email:', job.data);
//   // ...
// });

// stockCheckQueue.process(async (job) => {
//   // Scheduled stock check logic here
//   console.log('Running stock check:', job.data);
//   // ...
// });

// // Example: Add a scheduled stock check every day at midnight
// function scheduleStockCheck() {
//   stockCheckQueue.add({}, { repeat: { cron: '0 0 * * *' } });
// }

// module.exports = {
//   start: () => {
//     console.log('Job queues started (Bull)');
//     scheduleStockCheck();
//   },
//   reportQueue,
//   emailQueue,
//   stockCheckQueue,
// };
