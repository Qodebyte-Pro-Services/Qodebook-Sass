const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middlewares/authMiddleware');
const salesController = require('../controllers/salesController');
const { requirePermission, requireAuthOnly } = require('../utils/routeHelpers');
const { SALES_PERMISSIONS } = require('../constants/permissions');
const { rateLimitMiddleware } = require('../middlewares/rateLimitMiddleware');
/**
 * @swagger
 * /api/sales/create:
 *   post:
 *     summary: Record a sale
 *     description: >
 *       Creates a sale order and deducts stock.  
 *       **Either `staff_id` or `created_by_user_id` must be provided.**  
 *       If `customer_id` is `0`, a placeholder "Walk-in" customer will be used (or created for that business if it does not exist).
 *     tags: [Sales]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - business_id
 *               - branch_id
 *               - items
 *               - total_amount
 *               - payment_mode
 *             properties:
 *               business_id:
 *                 type: integer
 *                 example: 1
 *               branch_id:
 *                 type: integer
 *                 example: 2
 *               staff_id:
 *                 type: string
 *                 nullable: true
 *                 example: "STAFF123"
 *                 description: Staff identifier if the sale was recorded by a staff member.
 *               created_by_user_id:
 *                 type: integer
 *                 nullable: true
 *                 example: 5
 *                 description: User ID if the sale was recorded by a system user (non-staff).
 *               customer_id:
 *                 type: integer
 *                 example: 0
 *                 description: >
 *                   ID of the customer.  
 *                   Use `0` for a walk-in customer.  
 *                   If omitted and `customer` object is provided, a new customer is created.
 *               customer:
 *                 type: object
 *                 nullable: true
 *                 properties:
 *                   name:
 *                     type: string
 *                   phone:
 *                     type: string
 *                   email:
 *                     type: string
 *               order_type:
 *                 type: string
 *                 example: "walk_in"
 *                 description: Optional. Type of the order (e.g., walk_in, online).
 *               items:
 *                 type: array
 *                 description: List of items in the sale
 *                 items:
 *                   type: object
 *                   required:
 *                     - variant_id
 *                     - quantity
 *                     - unit_price
 *                     - total_price
 *                   properties:
 *                     variant_id:
 *                       type: integer
 *                     quantity:
 *                       type: integer
 *                     unit_price:
 *                       type: number
 *                     total_price:
 *                       type: number
 *               total_amount:
 *                 type: number
 *                 example: 150.50
 *               payment_mode:
 *                 type: string
 *                 example: "cash"
 *               discount:
 *                 type: number
 *                 nullable: true
 *               coupon:
 *                 type: string
 *                 nullable: true
 *               taxes:
 *                 type: number
 *                 nullable: true
 *               note:
 *                 type: string
 *                 nullable: true
 *                 example: "Customer paid exact cash"
 *     responses:
 *       201:
 *         description: Sale recorded successfully
 *       400:
 *         description: Missing required fields or validation failed
 *       500:
 *         description: Server error
 */
router.post('/create', ...requirePermission(SALES_PERMISSIONS.CREATE_SALE), rateLimitMiddleware, salesController.createSale);


/**
 * @swagger
 * /api/sales:
 *   get:
 *     summary: List all sales
 *     tags: [Sales]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of sales
 */
router.get('/', ...requirePermission(SALES_PERMISSIONS.VIEW_SALES), salesController.listSales);

/**
 * @swagger
 * /api/sales/{id}:
 *   get:
 *     summary: Get sale details
 *     tags: [Sales]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Sale ID
 *     responses:
 *       200:
 *         description: Sale details
 */
router.get('/:id', ...requirePermission(SALES_PERMISSIONS.VIEW_SALES), salesController.getSale);

/**
 * @swagger
 * /api/sales/refund/{id}:
 *   post:
 *     summary: Refund a sale
 *     tags: [Sales]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Sale ID
 *     responses:
 *       200:
 *         description: Sale refunded
 */
router.post('/refund/:id', authenticateToken, rateLimitMiddleware, salesController.refundSale);

module.exports = router;
