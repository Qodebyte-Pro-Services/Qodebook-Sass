const express = require('express');
const router = express.Router();
const { authenticateToken, isAdmin } = require('../middlewares/authMiddleware');
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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 variants:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Variant'
 *       409:
 *         description: SKU already exists
 */

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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 variants:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Variant'
 */


/**
 * @swagger
 * /api/variants/product/{productId}/variants/{variantId}:
 *   get:
 *     summary: Get a specific variant of a product
 *     tags: [Variant]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         schema:
 *           type: string
 *         required: true
 *         description: Product ID
 *       - in: path
 *         name: variantId
 *         schema:
 *           type: string
 *         required: true
 *         description: Variant ID
 *     responses:
 *       200:
 *         description: Variant found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 variant:
 *                   $ref: '#/components/schemas/Variant'
 *       404:
 *         description: Variant not found for this product
 */


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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 variant:
 *                   $ref: '#/components/schemas/Variant'
 *       404:
 *         description: Variant not found
 */

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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */


/**
 * @swagger
 * /api/variants/{id}:
 *   get:
 *     summary: Get a specific variant by ID
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
 *         description: Variant details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 variant:
 *                   $ref: '#/components/schemas/Variant'
 *       404:
 *         description: Variant not found
 */

/**
 * @swagger
 * /api/business/variants:
 *   get:
 *     summary: Get all variants under the authenticated user's business
 *     tags: [Variant]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of variants for the business
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 variants:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Variant'
 */

// Route bindings
router.post('/products/:id/variants/generate', authenticateToken, upload.single('image'), variantController.generateVariants);
router.get('/products/:id/variants', authenticateToken, variantController.listVariants);
router.get('/variants/product/:productId/variants/:variantId',authenticateToken,variantController.getVariantByProduct);
router.get('/variants/:id', authenticateToken, variantController.getVariantById);
router.get('/business/variants', authenticateToken, variantController.getVariantsByBusiness);
router.put('/variants/:id', authenticateToken, upload.single('image'), variantController.updateVariant);
router.delete('/variants/:id', authenticateToken, variantController.deleteVariant);


module.exports = router;
