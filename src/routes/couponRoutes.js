const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middlewares/authMiddleware');
const couponController = require('../controllers/couponController');

/**
 * @swagger
 * /api/coupons:
 *   post:
 *     summary: Create a coupon
 *     tags: [Coupon]
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
 *               code:
 *                 type: string
 *               description:
 *                 type: string
 *               discount_percentage:
 *                 type: number
 *               discount_amount:
 *                 type: number
 *               start_date:
 *                 type: string
 *                 format: date
 *               end_date:
 *                 type: string
 *                 format: date
 *               usage_limit:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Coupon created
 */
router.post('/', authenticateToken, couponController.createCoupon);

/**
 * @swagger
 * /api/coupons:
 *   get:
 *     summary: List all coupons
 *     tags: [Coupon]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of coupons
 */
router.get('/', authenticateToken, couponController.listCoupons);

/**
 * @swagger
 * /api/coupons/link:
 *   post:
 *     summary: Link a coupon to a product
 *     tags: [Coupon]
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
 *               coupon_id:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Product coupon link created
 */
router.post('/link', authenticateToken, couponController.linkCouponToProduct);

module.exports = router;
