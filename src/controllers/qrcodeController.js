
const QRCode = require('qrcode');

module.exports = {
 
  generate: async (req, res) => {
    try {
      const { variantId } = req.params;
      const qrPng = await QRCode.toBuffer(variantId, { type: 'png', scale: 8 });
      res.set('Content-Type', 'image/png');
      res.send(qrPng);
    } catch (err) {
      console.error('QR code generation error:');
      res.status(500).json({ message: 'Failed to generate QR code' });
    }
  },


  download: async (req, res) => {
    try {
      const { variantId } = req.params;
      const qrPng = await QRCode.toBuffer(variantId, { type: 'png', scale: 8 });
      res.set('Content-Disposition', `attachment; filename=qrcode-${variantId}.png`);
      res.set('Content-Type', 'image/png');
      res.send(qrPng);
    } catch (err) {
      console.error('QR code download error:');
      res.status(500).json({ message: 'Failed to download QR code' });
    }
  },
};
