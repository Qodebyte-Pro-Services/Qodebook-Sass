const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middlewares/authMiddleware');
const discountController = require('../controllers/discountController');
const { route } = require('./couponRoutes');

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
 * /api/discounts/product/{product_id}/variants:
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

/**
 * @swagger
 * /api/discounts/products-with-discounts:
 *   get:
 *     summary: Get all products and their associated discounts for a business
 *     tags: [Discount]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: business_id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID of the business to fetch products and their discounts for
 *     responses:
 *       200:
 *         description: List of products with their associated discounts
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 products_with_discounts:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       product_id:
 *                         type: integer
 *                         example: 10
 *                       product_name:
 *                         type: string
 *                         example: "Wireless Headphones"
 *                       discount_id:
 *                         type: integer
 *                         nullable: true
 *                         example: 5
 *                       discount_name:
 *                         type: string
 *                         nullable: true
 *                         example: "Holiday Sale"
 *                       percentage:
 *                         type: number
 *                         format: float
 *                         nullable: true
 *                         example: 15
 *                       amount:
 *                         type: number
 *                         format: float
 *                         nullable: true
 *                         example: 30
 *                       start_date:
 *                         type: string
 *                         format: date-time
 *                         nullable: true
 *                         example: "2025-09-01T00:00:00Z"
 *                       end_date:
 *                         type: string
 *                         format: date-time
 *                         nullable: true
 *                         example: "2025-09-15T23:59:59Z"
 *                       description:
 *                         type: string
 *                         nullable: true
 *                         example: "Limited time discount on audio products"
 *       400:
 *         description: Missing business_id parameter
 *       500:
 *         description: Server error
 */

router.get('/products-with-discounts', authenticateToken, discountController.getListOfProductsAndTheirDiscounts);

/**
 * @swagger
 * /api/discounts/{discount_id}:
 *   delete:
 *     summary: Delete a discount and unlink it from all products
 *     tags: [Discount]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: discount_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the discount to delete
 *     responses:
 *       200:
 *         description: Discount deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Discount deleted.
 *       400:
 *         description: Missing discount_id parameter
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Missing discount_id parameter.
 *       404:
 *         description: Discount not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Discount not found.
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Server error.
 */
router.delete('/:discount_id', authenticateToken, discountController.deleteDiscount);
module.exports = router;
