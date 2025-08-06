const bwipjs = require('bwip-js');
const pool = require('../config/db');
const uploadToCloudinary = require('../utils/uploadToCloudinary');

module.exports = {
 
  generate: async (req, res) => {
    try {
      const { variantId } = req.params;
    
      const result = await pool.query('SELECT barcode FROM variants WHERE id = $1', [variantId]);
      if (result.rows.length === 0) return res.status(404).json({ message: 'Variant not found.' });
      const barcodeValue = result.rows[0].barcode || variantId;
      const png = await bwipjs.toBuffer({
        bcid: 'code128',
        text: barcodeValue,
        scale: 3,
        height: 10,
        includetext: true,
        textxalign: 'center',
      });
      res.set('Content-Type', 'image/png');
      res.send(png);
    } catch (err) {
      console.error('Barcode generation error:', err);
      res.status(500).json({ message: 'Failed to generate barcode' });
    }
  },

 
  download: async (req, res) => {
    try {
      const { variantId } = req.params;
      const result = await pool.query('SELECT barcode FROM variants WHERE id = $1', [variantId]);
      if (result.rows.length === 0) return res.status(404).json({ message: 'Variant not found.' });
      const barcodeValue = result.rows[0].barcode || variantId;
      const png = await bwipjs.toBuffer({
        bcid: 'code128',
        text: barcodeValue,
        scale: 3,
        height: 10,
        includetext: true,
        textxalign: 'center',
      });
      res.set('Content-Disposition', `attachment; filename=barcode-${barcodeValue}.png`);
      res.set('Content-Type', 'image/png');
      res.send(png);
    } catch (err) {
      console.error('Barcode download error:', err);
      res.status(500).json({ message: 'Failed to download barcode' });
    }
  },

 
  saveBarcodeImage: async (req, res) => {
    try {
      const { variantId } = req.params;
      const result = await pool.query('SELECT barcode FROM variants WHERE id = $1', [variantId]);
      if (result.rows.length === 0) return res.status(404).json({ message: 'Variant not found.' });
      const barcodeValue = result.rows[0].barcode || variantId;
      const png = await bwipjs.toBuffer({
        bcid: 'code128',
        text: barcodeValue,
        scale: 3,
        height: 10,
        includetext: true,
        textxalign: 'center',
      });
     
      const url = await uploadToCloudinary(png, `barcode-${barcodeValue}`);
    
      await pool.query('UPDATE variants SET barcode_image_url = $1 WHERE id = $2', [url, variantId]);
      return res.status(200).json({ message: 'Barcode image saved.', url });
    } catch (err) {
      console.error('Barcode save error:', err);
      res.status(500).json({ message: 'Failed to save barcode image' });
    }
  },
};
