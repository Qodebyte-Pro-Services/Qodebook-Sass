const express = require('express');
const router = express.Router();
const controller = require('../controllers/barcodeController');
const auth = require('../middlewares/authMiddleware');
const { authenticateToken } = require('../middlewares/authMiddleware');
const barcodeController = require('../controllers/barcodeController');


/**
 * @swagger
 * tags:
 *   name: Barcode
 *   description: Barcode generation and management
 */

/**
 * @swagger
 * /api/barcode/{variantId}:
 *   get:
 *     summary: Generate a barcode image for a variant
 *     tags: [Barcode]
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
 *         description: Barcode image returned as PNG
 *         content:
 *           image/png:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Variant not found
 *       500:
 *         description: Failed to generate barcode
 */
router.get('/:variantId', auth.authenticateToken, controller.generate);


/**
 * @swagger
 * /api/barcode/{variantId}/download:
 *   get:
 *     summary: Download barcode image for a variant
 *     tags: [Barcode]
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
 *         description: Barcode image downloaded as PNG
 *         content:
 *           image/png:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Variant not found
 *       500:
 *         description: Failed to download barcode
 */
router.get('/:variantId/download', auth.authenticateToken, controller.download);


/**
 * @swagger
 * /api/barcode/{variantId}/save:
 *   post:
 *     summary: Generate and save barcode image for a variant to Cloudinary
 *     tags: [Barcode]
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
 *         description: Barcode image saved and URL updated in variant
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Barcode image saved.
 *                 url:
 *                   type: string
 *                   example: https://res.cloudinary.com/your_cloud/image/upload/v12345678/barcode.png
 *       404:
 *         description: Variant not found
 *       500:
 *         description: Failed to save barcode image
 */
router.post('/:variantId/save', authenticateToken, barcodeController.saveBarcodeImage);


module.exports = router;
