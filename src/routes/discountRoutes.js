const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middlewares/authMiddleware');
const discountController = require('../controllers/discountController');
const { route } = require('./couponRoutes');
const { SALES_PERMISSIONS } = require('../constants/permissions');
const { requirePermission } = require('../utils/routeHelpers');
const { rateLimitMiddleware } = require('../middlewares/rateLimitMiddleware');

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
router.post('/', ...requirePermission(SALES_PERMISSIONS.MANAGE_DISCOUNTS), rateLimitMiddleware, discountController.createDiscount);

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
router.post('/link', ...requirePermission(SALES_PERMISSIONS.MANAGE_DISCOUNTS), rateLimitMiddleware, discountController.linkDiscountToProduct);


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
 *   patch:
 *     summary: Update an existing discount
 *     tags: [Discounts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: discount_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Discount ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DiscountUpdate'
 *     responses:
 *       200:
 *         description: Discount successfully updated
 *       404:
 *         description: Discount not found
 *       500:
 *         description: Server error
 */
router.patch('/:discount_id', ...requirePermission(SALES_PERMISSIONS.MANAGE_DISCOUNTS), rateLimitMiddleware, discountController.updateDiscount);

/**
 * @swagger
 * /api/discounts/unlink/{discount_id}:
 *   delete:
 *     summary: Unlink a discount from all associated products
 *     description: Removes all product-discount associations for a given discount ID.
 *     tags: [Discounts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: discount_id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the discount to unlink from all products.
 *     responses:
 *       200:
 *         description: Discount successfully unlinked from all products.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Successfully unlinked discount 12345 from all associated products."
 *                 unlinked_count:
 *                   type: integer
 *                   example: 4
 *       400:
 *         description: Missing or invalid discount_id.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Missing required field: discount_id."
 *       404:
 *         description: No products linked to the given discount ID.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "No products are linked to this discount."
 *       500:
 *         description: Server error occurred while unlinking.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Server error."
 *                 error:
 *                   type: string
 *                   example: "Database query failed."
 */

/**
 * @swagger
 * /api/discounts/unlink-single/{discount_id}/{product_id}:
 *   delete:
 *     summary: Unlink a specific product from a discount
 *     description: Removes the association between a specific product and discount.
 *     tags: [Discounts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: discount_id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the discount.
 *       - in: path
 *         name: product_id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the product to unlink from the discount.
 *     responses:
 *       200:
 *         description: Product successfully unlinked from the discount.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Successfully unlinked product 67890 from discount 12345."
 *       400:
 *         description: Missing required parameters.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Missing required fields: product_id or discount_id."
 *       404:
 *         description: Product not linked to the specified discount.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "This product is not linked to the specified discount."
 *       500:
 *         description: Server error occurred while unlinking.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Server error."
 *                 error:
 *                   type: string
 *                   example: "Database query failed."
 */
router.delete('/unlink/:discount_id', ...requirePermission(SALES_PERMISSIONS.MANAGE_DISCOUNTS), rateLimitMiddleware, discountController.unlinkDiscountFromProducts);
router.delete('/unlink-single/:discount_id/:product_id', ...requirePermission(SALES_PERMISSIONS.MANAGE_DISCOUNTS), rateLimitMiddleware, discountController.unlinkDiscountFromProduct);


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
router.delete('/:discount_id',  ...requirePermission(SALES_PERMISSIONS.MANAGE_DISCOUNTS), rateLimitMiddleware, discountController.deleteDiscount);
module.exports = router;
