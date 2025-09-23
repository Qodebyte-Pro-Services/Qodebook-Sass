// Load environment variables
require('dotenv').config();

const { processReports } = require('./worker'); // Your existing workers.js logic

console.log('🚀 Report worker started...');

async function runReports() {
  try {
    console.log('⏳ Checking for pending reports...');
    await processReports();
    console.log('✅ Finished processing reports.');
  } catch (err) {
    console.error('❌ Error processing reports:', err);
  }
}

// Run once immediately
runReports();

// Schedule to run every 5 minutes
const interval = 5 * 60 * 1000;
setInterval(() => {
  runReports();
}, interval);
