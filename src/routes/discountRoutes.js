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

module.exports = router;
