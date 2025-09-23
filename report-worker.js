require('dotenv').config();
const { processReports } = require('./worker');

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

// Schedule every 5 minutes
setInterval(runReports, 5 * 60 * 1000);
