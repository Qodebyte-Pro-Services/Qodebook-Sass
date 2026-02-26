// worker.js
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const StockNotificationService = require('./src/services/stockNotificationService');



async function processReports() {
  const client = await pool.connect();
  try {
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
        await client.query(`UPDATE reports SET status = 'processing' WHERE id = $1`, [report.id]);

        const reportData = await generateReportData(report.params);
        const outputDir = path.join(__dirname, 'generated_reports');
        if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

        const filePath = path.join(outputDir, `report_${report.id}.${report.format}`);
        if (report.format === 'json') fs.writeFileSync(filePath, JSON.stringify(reportData, null, 2));
        else if (report.format === 'pdf') await generatePDF(reportData, filePath);

        await client.query(
          `UPDATE reports SET status = 'completed', result_path = $2 WHERE id = $1`,
          [report.id, filePath]
        );

        console.log(`✅ Report ${report.id} completed`);
      } catch (err) {
        console.error(`❌ Report ${report.id} failed:`, err.message);
        await client.query(
          `UPDATE reports SET status = 'failed', error = $2 WHERE id = $1`,
          [report.id, err.message]
        );
      }
    }
  } finally {
    client.release();
  }
}

async function generateReportData(params) {
  return { summary: { total_orders: 100, total_sales: 5000 }, products: [], payment_methods: [] };
}

async function generatePDF(data, filePath) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument();
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    doc.fontSize(18).text('Sales Report', { align: 'center' }).moveDown();
    doc.fontSize(12).text(`Total Orders: ${data.summary.total_orders}`);
    doc.text(`Total Sales: ${data.summary.total_sales}`);
    doc.end();

    stream.on('finish', resolve);
    stream.on('error', reject);
  });
}


async function checkAllStockLevels() {
  try {
    const variantsRes = await pool.query(`
      SELECT v.id, p.business_id
      FROM variants v
      JOIN products p ON v.product_id = p.id
    `);

    for (const variant of variantsRes.rows) {
      await StockNotificationService.checkLowStock(variant.id, variant.business_id);
      await StockNotificationService.checkOutOfStock(variant.id, variant.business_id);
    }
    console.log('✅ Stock levels checked for all variants');
  } catch (err) {
    console.error('❌ Error checking stock levels:');
  }
}

module.exports = { processReports, checkAllStockLevels };
