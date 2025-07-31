// qrcodeController.js
// Use qrcode for QR code generation
module.exports = {
  generate: async (req, res) => {
    // TODO: Generate QR code for variantId
    res.json({ message: 'QR code generated (stub)' });
  },
  download: async (req, res) => {
    // TODO: Download QR code as PNG/PDF
    res.json({ message: 'QR code download (stub)' });
  },
};
