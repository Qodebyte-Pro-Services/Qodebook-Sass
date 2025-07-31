// qrcodeRoutes.js
const express = require('express');
const router = express.Router();
const controller = require('../controllers/qrcodeController');
const auth = require('../middlewares/authMiddleware');

/**
 * @swagger
 * /api/qrcode/{variantId}:
 *   get:
 *     summary: Generate QR code for a product variant
 *     tags: [QRCode]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: variantId
 *         schema:
 *           type: string
 *         required: true
 *         description: Variant ID
 *     responses:
 *       200:
 *         description: QR code generated
 */
router.get('/:variantId', auth.authenticateToken, controller.generate);

/**
 * @swagger
 * /api/qrcode/{variantId}/download:
 *   get:
 *     summary: Download QR code for a product variant
 *     tags: [QRCode]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: variantId
 *         schema:
 *           type: string
 *         required: true
 *         description: Variant ID
 *     responses:
 *       200:
 *         description: QR code file
 */
router.get('/:variantId/download', auth.authenticateToken, controller.download);

module.exports = router;
