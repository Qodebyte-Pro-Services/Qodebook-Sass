const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middlewares/authMiddleware');
const salesController = require('../controllers/salesController');
const { requirePermission, requireAuthOnly } = require('../utils/routeHelpers');
const { SALES_PERMISSIONS } = require('../constants/permissions');
/**
 * @swagger
 * /api/sales/create:
 *   post:
 *     summary: Record a sale
 *     tags: [Sales]
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
 *               branch_id:
 *                 type: integer
 *               staff_id:
 *                 type: string
 *               customer_id:
 *                 type: integer
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
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
 *               payment_mode:
 *                 type: string
 *               discount:
 *                 type: number
 *               coupon:
 *                 type: string
 *               taxes:
 *                 type: number
 *               note:
 *                 type: string
 *     responses:
 *       201:
 *         description: Sale recorded
 */
router.post('/create', ...requirePermission(SALES_PERMISSIONS.CREATE_SALE), salesController.createSale);

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
router.get('/', authenticateToken, salesController.listSales);

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
router.get('/:id', authenticateToken, salesController.getSale);

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
router.post('/refund/:id', authenticateToken, salesController.refundSale);

module.exports = router;
