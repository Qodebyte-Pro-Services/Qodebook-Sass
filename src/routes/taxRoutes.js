const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middlewares/authMiddleware');
const taxController = require('../controllers/taxController');

/**
 * @swagger
 * /api/taxes:
 *   post:
 *     summary: Create a tax
 *     tags: [Tax]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               business_id:
 *                 type: integer
 *               name:
 *                 type: string
 *               rate:
 *                 type: number
 *               type:
 *                 type: string
 *                 enum: [inclusive, exclusive]
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Tax created
 */
router.post('/', authenticateToken, taxController.createTax);

/**
 * @swagger
 * /api/taxes:
 *   get:
 *     summary: List all taxes
 *     tags: [Tax]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of taxes
 */
router.get('/', authenticateToken, taxController.listTaxes);

/**
 * @swagger
 * /api/taxes/link:
 *   post:
 *     summary: Link a tax to a product
 *     tags: [Tax]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               product_id:
 *                 type: integer
 *               tax_id:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Product tax link created
 */
router.post('/link', authenticateToken, taxController.linkTaxToProduct);

/**
 * @swagger
 * /api/taxes/product/{product_id}:
 *   get:
 *     summary: Get taxes for a specific product
 *     tags: [Tax]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: product_id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of taxes for the product
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 taxes:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       name:
 *                         type: string
 *                       rate:
 *                         type: number
 *                       type:
 *                         type: string
 *                       description:
 *                         type: string
 */
router.get('/product/:product_id', authenticateToken, taxController.getTaxesForProduct);

/**
 * @swagger
 * /api/taxes/product/{product_id}/variants:
 *   get:
 *     summary: Get taxes for all variants of a specific product
 *     tags: [Tax]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: product_id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of taxes for the product variants
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 taxes:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       name:
 *                         type: string
 *                       rate:
 *                         type: number
 *                       type:
 *                         type: string
 *                       description:
 *                         type: string
 */
router.get('/product/:product_id/variants', authenticateToken, taxController.getTaxesForVariantsBasedOnProduct);

module.exports = router;
