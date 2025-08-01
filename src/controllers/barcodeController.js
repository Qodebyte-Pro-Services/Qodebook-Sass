// barcodeController.js
const bwipjs = require('bwip-js');

module.exports = {
 
  generate: async (req, res) => {
    try {
      const { variantId } = req.params;
      const png = await bwipjs.toBuffer({
        bcid: 'code128',       
        text: variantId,      
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
      const png = await bwipjs.toBuffer({
        bcid: 'code128',
        text: variantId,
        scale: 3,
        height: 10,
        includetext: true,
        textxalign: 'center',
      });
      res.set('Content-Disposition', `attachment; filename=barcode-${variantId}.png`);
      res.set('Content-Type', 'image/png');
      res.send(png);
    } catch (err) {
      console.error('Barcode download error:', err);
      res.status(500).json({ message: 'Failed to download barcode' });
    }
  },
};
