const pool = require('../config/db');
const path = require('path');
const fs = require('fs');
const Papa = require('papaparse');
const XLSX = require('xlsx');

module.exports = {
  upload: async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ message: 'No file uploaded.' });
      const { user_id } = req.user || {};
      const ext = path.extname(req.file.originalname).toLowerCase();
      let data = [];
      let status = 'success';
      let summary = '';
      if (ext === '.csv') {
        const csvStr = fs.readFileSync(req.file.path, 'utf8');
        const parsed = Papa.parse(csvStr, { header: true });
        data = parsed.data;
        summary = `Parsed ${data.length} rows from CSV.`;
      } else if (ext === '.xlsx' || ext === '.xls') {
        const workbook = XLSX.readFile(req.file.path);
        const sheetName = workbook.SheetNames[0];
        data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
        summary = `Parsed ${data.length} rows from Excel.`;
      } else {
        status = 'failed';
        summary = 'Unsupported file type.';
      }
      // Save import history
      await pool.query(
        'INSERT INTO import_history (user_id, file_name, status, summary) VALUES ($1, $2, $3, $4)',
        [user_id, req.file.originalname, status, summary]
      );
      // Optionally, process data for bulk import here
      res.json({ message: status === 'success' ? 'Import started' : summary, summary, rows: data.length });
    } catch (err) {
      console.error('Import upload error:', err);
      res.status(500).json({ message: 'Failed to process import.' });
    }
  },
  template: async (req, res) => {
    try {
      // Serve a static template file (CSV or Excel)
      const templatePath = path.join(__dirname, '../templates/import_template.csv');
      if (fs.existsSync(templatePath)) {
        res.download(templatePath, 'import_template.csv');
      } else {
        res.status(404).json({ message: 'Template not found.' });
      }
    } catch (err) {
      console.error('Import template error:', err);
      res.status(500).json({ message: 'Failed to download template.' });
    }
  },
  history: async (req, res) => {
    try {
      const { user_id } = req.user || {};
      const result = await pool.query(
        'SELECT * FROM import_history WHERE user_id = $1 ORDER BY created_at DESC',
        [user_id]
      );
      res.json({ history: result.rows });
    } catch (err) {
      console.error('Import history error:', err);
      res.status(500).json({ message: 'Failed to fetch import history.' });
    }
  },
};
