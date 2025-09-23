const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function processReports() {
  const client = await pool.connect();
  try {
    // Fetch pending reports
    const res = await client.query(
      `SELECT id, business_id, params, format
       FROM reports
       WHERE status = 'pending'
       ORDER BY created_at ASC
       LIMIT 5`
    );

    if (res.rows.length === 0) {
  console.log('No pending reports found.');
  return;
}


    for (const report of res.rows) {
      console.log(`Processing report ${report.id}`);
      try {
        // Mark as processing
        await client.query(
          `UPDATE reports SET status = 'processing' WHERE id = $1`,
          [report.id]
        );

        const params = report.params; // JSON saved earlier
        const format = report.format;

        // 👉 Reuse your existing salesReport logic here
        const reportData = await generateReportData(params);

        // Save report file
        const outputDir = path.join(__dirname, 'generated_reports');
        if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

        const filePath = path.join(
          outputDir,
          `report_${report.id}.${format}`
        );

        if (format === 'json') {
          fs.writeFileSync(filePath, JSON.stringify(reportData, null, 2));
        } else if (format === 'pdf') {
          await generatePDF(reportData, filePath);
        }

        // Mark as completed
        await client.query(
          `UPDATE reports
           SET status = 'completed',
               result_path = $2
           WHERE id = $1`,
          [report.id, filePath]
        );

        console.log(`✅ Report ${report.id} completed`);
      } catch (err) {
        console.error(`❌ Report ${report.id} failed:`, err.message);
        await client.query(
          `UPDATE reports
           SET status = 'failed',
               error = $2
           WHERE id = $1`,
          [report.id, err.message]
        );
      }
    }
  } finally {
    client.release();
  }
}

// Example: generate report data (reuse controller logic without res)
async function generateReportData(params) {
  // 👉 This would call the same SQL queries used in your salesReport controller
  return {
    summary: { total_orders: 100, total_sales: 5000 },
    products: [],
    payment_methods: [],
  };
}

// Example: PDF generator
async function generatePDF(data, filePath) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument();
    const stream = fs.createWriteStream(filePath);

    doc.pipe(stream);
    doc.fontSize(18).text('Sales Report', { align: 'center' });
    doc.moveDown();

    doc.fontSize(12).text(`Total Orders: ${data.summary.total_orders}`);
    doc.text(`Total Sales: ${data.summary.total_sales}`);
    doc.end();

    stream.on('finish', resolve);
    stream.on('error', reject);
  });
}

// Run job every 5 minutes
setInterval(processReports, 5 * 60 * 1000);


module.exports = { processReports };
