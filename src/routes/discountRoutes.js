const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middlewares/authMiddleware');
const discountController = require('../controllers/discountController');

/**
 * @swagger
 * /api/discounts:
 *   post:
 *     summary: Create a discount
 *     tags: [Discount]
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
 *               percentage:
 *                 type: number
 *               amount:
 *                 type: number
 *               start_date:
 *                 type: string
 *                 format: date
 *               end_date:
 *                 type: string
 *                 format: date
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Discount created
 */
router.post('/', authenticateToken, discountController.createDiscount);

/**
 * @swagger
 * /api/discounts:
 *   get:
 *     summary: List all discounts
 *     tags: [Discount]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of discounts
 */
router.get('/', authenticateToken, discountController.listDiscounts);

/**
 * @swagger
 * /api/discounts/link:
 *   post:
 *     summary: Link a discount to a product
 *     tags: [Discount]
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
 *               discount_id:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Product discount link created
 */
router.post('/link', authenticateToken, discountController.linkDiscountToProduct);


/**
 * @swagger
 * /api/discounts/product/{product_id}:
 *   get:
 *     summary: Get discounts for a specific product
 *     tags: [Discount]
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
 *         description: List of discounts for the product
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 discounts:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       business_id:
 *                         type: integer
 *                       name:
 *                         type: string
 *                       percentage:
 *                         type: number
 *                       amount:
 *                         type: number
 *                       start_date:
 *                         type: string
 *                         format: date
 *                       end_date:
 *                         type: string
 *                         format: date
 *                       description:
 *                         type: string
 */
router.get('/product/:product_id', authenticateToken, discountController.getDiscountsForProduct);


/**
 * @swagger
 * /api/discounts/variants/product/{product_id}:
 *   get:
 *     summary: Get discounts for all variants of a specific product
 *     tags: [Discount]
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
 *         description: List of discounts for the product variants
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 discounts:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       business_id:
 *                         type: integer
 *                       name:
 *                         type: string
 *                       percentage:
 *                         type: number
 *                       amount:
 *                         type: number
 *                       start_date:
 *                         type: string
 *                         format: date
 *                       end_date:
 *                         type: string
 *                         format: date
 *                       description:
 *                         type: string
 */
router.get('/product/:product_id/variants', authenticateToken, discountController.getDiscountsForVariantsBasedOnProduct);


module.exports = router;
