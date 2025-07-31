const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/upload');
const variantController = require('../controllers/variantController');

/**
 * @swagger
 * /api/products/{id}/variants/generate:
 *   post:
 *     summary: Auto-generate variants from selected attributes
 *     tags: [Variant]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Product ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               variants:
 *                 type: string
 *                 description: JSON stringified array of variant objects
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Variants generated
 *       409:
 *         description: SKU already exists
 */
router.post('/products/:id/variants/generate', authenticateToken, upload.single('image'), variantController.generateVariants);

/**
 * @swagger
 * /api/products/{id}/variants:
 *   get:
 *     summary: List variants for a product
 *     tags: [Variant]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Product ID
 *     responses:
 *       200:
 *         description: List of variants
 */
router.get('/products/:id/variants', authenticateToken, variantController.listVariants);

/**
 * @swagger
 * /api/variants/product/{id}:
 *   get:
 *     summary: Get variants of a product
 *     tags: [Variant]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Product ID
 *     responses:
 *       200:
 *         description: List of variants for the product
 */
router.get('/variants/product/:id', authenticateToken, variantController.getVariantsByProduct);

/**
 * @swagger
 * /api/variants/{id}:
 *   put:
 *     summary: Update variant
 *     tags: [Variant]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Variant ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               attributes:
 *                 type: object
 *               cost_price:
 *                 type: number
 *               selling_price:
 *                 type: number
 *               quantity:
 *                 type: integer
 *               threshold:
 *                 type: integer
 *               sku:
 *                 type: string
 *               image:
 *                 type: string
 *                 format: binary
 *               expiry_date:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Variant updated
 *       404:
 *         description: Variant not found
 */
router.put('/variants/:id', authenticateToken, upload.single('image'), variantController.updateVariant);

/**
 * @swagger
 * /api/variants/{id}:
 *   delete:
 *     summary: Delete variant
 *     tags: [Variant]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Variant ID
 *     responses:
 *       200:
 *         description: Variant deleted
 */
router.delete('/variants/:id', authenticateToken, variantController.deleteVariant);

module.exports = router;
