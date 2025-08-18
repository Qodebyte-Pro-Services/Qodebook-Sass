const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middlewares/authMiddleware');
const { requirePermission, requireAuthOnly } = require('../utils/routeHelpers');
const { STOCK_PERMISSIONS } = require('../constants/permissions'); 
const orderController = require('../controllers/orderController');

/**
 * @swagger
 * /api/orders:
 *   post:
 *     summary: Create an order
 *     tags: [Order]
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
 *               status:
 *                 type: string
 *                 enum: [completed, pending, canceled]
 *     responses:
 *       201:
 *         description: Order created
 */
router.post('/', ...requirePermission(STOCK_PERMISSIONS.VIEW_STOCK), orderController.createOrder);

/**
 * @swagger
 * /api/orders:
 *   get:
 *     summary: List all orders
 *     tags: [Order]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of orders
 */
router.get('/', authenticateToken, orderController.listOrders);

/**
 * @swagger
 * /api/orders/{id}:
 *   get:
 *     summary: Get order details
 *     tags: [Order]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Order ID
 *     responses:
 *       200:
 *         description: Order details
 */
router.get('/:id', authenticateToken, orderController.getOrder);

/**
 * @swagger
 * /api/orders/{id}:
 *   put:
 *     summary: Update order status
 *     tags: [Order]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Order ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [completed, pending, canceled]
 *     responses:
 *       200:
 *         description: Order updated
 */
router.put('/:id', authenticateToken, orderController.updateOrderStatus);

/**
 * @swagger
 * /api/orders/{id}:
 *   delete:
 *     summary: Cancel an order
 *     tags: [Order]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Order ID
 *     responses:
 *       200:
 *         description: Order canceled
 */
router.delete('/:id', authenticateToken, orderController.cancelOrder);

module.exports = router;
