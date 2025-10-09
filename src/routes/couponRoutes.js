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

/**
 * @swagger
 * /api/coupons/product/{product_id}:
 *   get:
 *     summary: Get coupons for a specific product
 *     tags: [Coupon]
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
 *         description: List of coupons for the product
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 coupons:
 *                   type: array
 */
router.get('/product/:product_id', authenticateToken, couponController.getCouponsForProduct);


/**
 * @swagger
 * /api/coupons/product/{product_id}/variants:
 *   get:
 *     summary: Get coupons for all variants of a specific product
 *     tags: [Coupon]
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
 *         description: List of coupons for the product variants
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 coupons:
 *                   type: array
 */
router.get('/product/:product_id/variants', authenticateToken, couponController.getCouponsForVariantsBasedOnProduct);

/**
 * @swagger
 * /api/coupons/products-with-coupons:
 *   get:
 *     summary: Get all products and their associated coupons for a business
 *     tags: [Coupon]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: business_id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID of the business to fetch products and their coupons for
 *     responses:
 *       200:
 *         description: List of products with their associated coupons
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 products_with_coupons:
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
 *                       coupon_id:
 *                         type: integer
 *                         nullable: true
 *                         example: 3
 *                       coupon_code:
 *                         type: string
 *                         nullable: true
 *                         example: "SAVE20"
 *                       description:
 *                         type: string
 *                         nullable: true
 *                         example: "20% off on electronics"
 *                       discount_percentage:
 *                         type: number
 *                         format: float
 *                         nullable: true
 *                         example: 20
 *                       discount_amount:
 *                         type: number
 *                         format: float
 *                         nullable: true
 *                         example: 50
 *                       start_date:
 *                         type: string
 *                         format: date-time
 *                         nullable: true
 *                         example: "2025-09-01T00:00:00Z"
 *                       end_date:
 *                         type: string
 *                         format: date-time
 *                         nullable: true
 *                         example: "2025-09-30T23:59:59Z"
 *       400:
 *         description: Missing business_id parameter
 *       500:
 *         description: Server error
 */
router.get('/products-with-coupons', authenticateToken, couponController.getListOfProductsAndTheirCoupons);

/**
 * @swagger
 * /api/coupons/{coupon_id}:
 *   delete:
 *     summary: Delete a coupon and unlink it from all products
 *     tags: [Coupon]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: coupon_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the coupon to delete
 *     responses:
 *       200:
 *         description: Coupon deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Coupon deleted successfully.
 *       400:
 *         description: Missing coupon_id parameter
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Missing coupon_id parameter
 *       404:
 *         description: Coupon not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Coupon not found
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Internal server error
 */
router.delete('/:coupon_id', authenticateToken, couponController.deleteCoupon);
module.exports = router;
