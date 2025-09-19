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

/**
 * @swagger
 * /api/taxes/products-with-taxes:
 *   get:
 *     summary: Get all products and their associated taxes for a business
 *     tags: [Tax]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: business_id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID of the business to fetch products and their taxes for
 *     responses:
 *       200:
 *         description: List of products with their associated taxes
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 products_with_taxes:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       product_id:
 *                         type: integer
 *                         example: 1
 *                       product_name:
 *                         type: string
 *                         example: "Laptop"
 *                       tax_id:
 *                         type: integer
 *                         nullable: true
 *                         example: 2
 *                       tax_name:
 *                         type: string
 *                         nullable: true
 *                         example: "VAT"
 *                       rate:
 *                         type: number
 *                         format: float
 *                         nullable: true
 *                         example: 7.5
 *                       type:
 *                         type: string
 *                         nullable: true
 *                         example: "percentage"
 *       400:
 *         description: Missing business_id parameter
 *       500:
 *         description: Server error
 */

router.get('/products-with-taxes', authenticateToken, taxController.getListOfProductsAndTheirTaxes);

module.exports = router;
