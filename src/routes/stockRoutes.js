

const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middlewares/authMiddleware');
const stockController = require('../controllers/stockController');
const { requirePermission, requireAuthOnly } = require('../utils/routeHelpers');
const { STOCK_PERMISSIONS } = require('../constants/permissions');
const { rateLimitMiddleware } = require('../middlewares/rateLimitMiddleware');

/**
 * @swagger
 * /api/stock/adjust:
 *   post:
 *     summary: Manually adjust stock for one or more variants
 *     tags: [Stock]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             oneOf:
 *               - type: object
 *                 properties:
 *                   adjustments:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         variant_id:
 *                           type: integer
 *                         new_quantity:
 *                           type: integer
 *                         reason:
 *                           type: string
 *                           description: Reason for stock adjustment (e.g., 'increase' or 'decrease')
 *                         notes:
 *                           type: string
 *               - type: object
 *                 properties:
 *                   variant_id:
 *                     type: integer
 *                   new_quantity:
 *                     type: integer
 *                   reason:
 *                     type: string
 *                     description: Reason for stock adjustment (e.g., 'increase' or 'decrease')
 *                   notes:
 *                     type: string
 *     responses:
 *       200:
 *         description: Stock adjusted (batch or single)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 results:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       variant_id:
 *                         type: integer
 *                       message:
 *                         type: string
 *                       old_quantity:
 *                         type: integer
 *                       new_quantity:
 *                         type: integer
 *                       quantity_change:
 *                         type: integer
 *                       error:
 *                         type: string
 */
router.post('/adjust', ...requirePermission(STOCK_PERMISSIONS.ADJUST_STOCK), rateLimitMiddleware, stockController.adjustStock);


/**
 * @swagger
 * /api/stock/create-supply-order:
 *   post:
 *     summary: Create a supply order for one or more variants
 *     tags: [Stock]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               variants:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     variant_id:
 *                       type: integer
 *                     quantity:
 *                       type: integer
 *                     cost_price:
 *                       type: number
 *               business_id:
 *                 type: integer
 *               supplier_id:
 *                 type: integer
 *               expected_delivery_date:
 *                 type: string
 *                 format: date
 *               supply_order_date:
 *                 type: string
 *                 format: date
 *               supply_status:
 *                 type: string
 *                 enum: [awaiting_payment, paid, delivered, cancelled]
 *     responses:
 *       201:
 *         description: Supply order created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 supply_order:
 *                   type: object
 *                 items:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       variant_id:
 *                         type: integer
 *                       quantity:
 *                         type: integer
 *                       cost_price:
 *                         type: number
 */
router.post('/create-supply-order', ...requirePermission(STOCK_PERMISSIONS.RESTOCK_ITEMS), rateLimitMiddleware, stockController.createSupplyOrder);
/**
 * @swagger
 * /api/stock/get-supply-orders:
 *   get:
 *     summary: Get all supply orders for the authenticated business
 *     tags: [Stock]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of supply orders
 */
router.get('/get-supply-orders', ...requirePermission(STOCK_PERMISSIONS.VIEW_STOCK), stockController.getSupplyOrders);
/**
 * @swagger
 * /api/stock/get-supply-order:
 *   get:
 *     summary: Get a specific supply order by ID
 *     tags: [Stock]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: supply_order_id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Supply order details
 */
router.get('/get-supply-order/:id', ...requirePermission(STOCK_PERMISSIONS.VIEW_STOCK), stockController.getSupplyOrder);
/**
 * @swagger
 * /api/stock/supply-status:
 *   post:
 *     summary: Update supply status for a supply entry
 *     tags: [Stock]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               supply_order_id:
 *                 type: integer
 *               supply_status:
 *                 type: string
 *                 enum: [awaiting_payment, paid, delivered, cancelled]
 *     responses:
 *       200:
 *         description: Supply status updated
 */
router.post('/supply-status', ...requirePermission(STOCK_PERMISSIONS.MANAGE_STOCK), rateLimitMiddleware, stockController.updateSupplyStatus);

/**
 * @swagger
 * /api/stock/supply-order/edit:
 *   put:
 *     summary: Edit a supply order (excluding supply_status)
 *     tags: [Supplier]
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
 *               - supply_order_id
 *             properties:
 *               business_id:
 *                 type: integer
 *                 description: Business ID
 *               supply_order_id:
 *                 type: integer
 *                 description: Supply Order ID
 *               supplier_id:
 *                 type: integer
 *                 description: Supplier ID
 *               expected_delivery_date:
 *                 type: string
 *                 format: date
 *               supply_order_date:
 *                 type: string
 *                 format: date
 *             example:
 *               business_id: 1
 *               supply_order_id: 10
 *               supplier_id: 2
 *               expected_delivery_date: "2025-10-10"
 *               supply_order_date: "2025-10-01"
 *     responses:
 *       200:
 *         description: Supply order updated
 *       400:
 *         description: Missing or invalid fields
 *       404:
 *         description: Supply order not found
 */
router.put('/supply-order/edit', ...requirePermission(STOCK_PERMISSIONS.MANAGE_STOCK), rateLimitMiddleware, stockController.editSupplyOrder);

/**
 *  @swagger
 * /api/stock/delete-supply-order:
 *  delete:
 * summary: Delete a supply order
 * tags: [Stock]
 * security:
 *  - bearerAuth: []
 * parameters:
 * - in: query
 * name: supply_order_id
 * required: true
 * schema:
 * 
 */
router.delete('/delete-supply-order', ...requirePermission(STOCK_PERMISSIONS.MANAGE_STOCK), rateLimitMiddleware, stockController.deleteSupplyOrder);

/**
 * @swagger
 * /api/stock/history:
 *   get:
 *     summary: Get full stock movement history (filterable by business, branch, variant, type, date)
 *     tags: [Stock]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: variant_id
 *         schema:
 *           type: integer
 *         description: Variant ID (optional)
 *       - in: query
 *         name: branch_id
 *         schema:
 *           type: integer
 *         description: Branch ID (optional)
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: Movement type (optional)
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date (optional)
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date
 *         description: End date (optional)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Limit (optional)
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Offset (optional)
 *     responses:
 *       200:
 *         description: Stock movement history (filtered by business_id and optionally branch_id)
 */
router.get('/history', authenticateToken, stockController.getStockHistory);

// /**
//  * @swagger
//  * /api/stock/restock:
//  *   post:
//  *     summary: Restock one or more variants
//  *     tags: [Stock]
//  *     security:
//  *       - bearerAuth: []
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *             oneOf:
//  *               - type: object
//  *                 properties:
//  *                   variants:
//  *                     type: array
//  *                     items:
//  *                       type: object
//  *                       properties:
//  *                         variant_id:
//  *                           type: integer
//  *                         quantity:
//  *                           type: integer
//  *                         cost_price:
//  *                           type: number
//  *                   note:
//  *                     type: string
//  *                   supplier_id:
//  *                     type: integer
//  *                   expected_delivery_date:
//  *                     type: string
//  *                     format: date
//  *                   supply_order_date:
//  *                     type: string
//  *                     format: date
//  *                   supply_status:
//  *                     type: string
//  *                     enum: [awaiting_payment, paid, delivered, cancelled]
//  *               - type: object
//  *                 properties:
//  *                   variant_id:
//  *                     type: integer
//  *                   quantity:
//  *                     type: integer
//  *                   cost_price:
//  *                     type: number
//  *                   note:
//  *                     type: string
//  *                   supplier_id:
//  *                     type: integer
//  *                   expected_delivery_date:
//  *                     type: string
//  *                     format: date
//  *                   supply_order_date:
//  *                     type: string
//  *                     format: date
//  *                   supply_status:
//  *                     type: string
//  *                     enum: [awaiting_payment, paid, delivered, cancelled]
//  *     responses:
//  *       200:
//  *         description: Restock results (batch or single)
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: object
//  *               properties:
//  *                 results:
//  *                   type: array
//  *                   items:
//  *                     type: object
//  *                     properties:
//  *                       variant_id:
//  *                         type: integer
//  *                       message:
//  *                         type: string
//  *                       error:
//  *                         type: string
//  *                       old_quantity:
//  */
// router.post('/restock', authenticateToken, stockController.restockVariant);

/**
 * @swagger
 * /api/stock/movement:
 *   get:
 *     summary: Get all stock movement logs for the authenticated business
 *     tags: [Stock]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Stock movement logs (filtered by business_id)
 */
router.get('/movement', ...requirePermission(STOCK_PERMISSIONS.VIEW_STOCK), stockController.getStockMovements);

/**
 * @swagger
 * /api/stock/movement/variant/{id}:
 *   get:
 *     summary: Get stock movement logs for a variant
 *     tags: [Stock]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Variant ID
 *     responses:
 *       200:
 *         description: Stock movement logs for variant
 */
router.get('/movement/variant/:id', ...requirePermission(STOCK_PERMISSIONS.VIEW_STOCK), stockController.getStockMovementsByVariant);

/**
 * @swagger
 * /api/stock/movement/{id}:
 *   delete:
 *     summary: Delete a stock movement log
 *     tags: [Stock]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Log ID
 *     responses:
 *       200:
 *         description: Stock movement deleted
 */
router.delete('/movement/:id', ...requirePermission(STOCK_PERMISSIONS.MANAGE_STOCK), rateLimitMiddleware, stockController.deleteStockMovement);

/**
 * @swagger
 * /api/stock/status/low:
 *   get:
 *     summary: Get low stock items
 *     tags: [Stock]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Low stock items
 */
router.get('/status/low', ...requirePermission(STOCK_PERMISSIONS.VIEW_STOCK), stockController.getLowStock);

/**
 * @swagger
 * /api/stock/status/out-of-stock:
 *   get:
 *     summary: Get out of stock items
 *     tags: [Stock]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Out of stock items
 */
router.get('/status/out-of-stock', ...requirePermission(STOCK_PERMISSIONS.VIEW_STOCK), stockController.getOutOfStock);

/**
 * @swagger
 * /api/stock/status/expired:
 *   get:
 *     summary: Get expired stock
 *     tags: [Stock]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Expired stock
 */
router.get('/status/expired', ...requirePermission(STOCK_PERMISSIONS.VIEW_STOCK), stockController.getExpiredStock);

/**
 * @swagger
 * /api/stock/status/recent:
 *   get:
 *     summary: Get recently restocked items
 *     tags: [Stock]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Recently restocked items
 */
router.get('/status/recent', ...requirePermission(STOCK_PERMISSIONS.VIEW_STOCK), stockController.getRecentlyRestocked);

/**
 * @swagger
 * /api/stock/status/fast-moving:
 *   get:
 *     summary: Get fast-moving items for the authenticated business
 *     tags: [Stock]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Fast-moving items (filtered by business_id)
 */
router.get('/status/fast-moving', ...requirePermission(STOCK_PERMISSIONS.VIEW_STOCK), stockController.getFastMoving);

/**
 * @swagger
 * /api/stock/status/slow-moving:
 *   get:
 *     summary: Get slow-moving items for the authenticated business
 *     tags: [Stock]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Slow-moving items (filtered by business_id)
 */
router.get('/status/slow-moving', ...requirePermission(STOCK_PERMISSIONS.VIEW_STOCK), stockController.getSlowMoving);

/**
 * @swagger
 * /api/stock/transfer:
 *   post:
 *     summary: Transfer stock between branches
 *     tags: [Stock]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               variant_id:
 *                 type: integer
 *               from_branch_id:
 *                 type: integer
 *               to_branch_id:
 *                 type: integer
 *               quantity:
 *                 type: integer
 *               reason:
 *                 type: string
 *               expected_delivery_date:
 *                 type: string
 *                 format: date
 *               transfer_notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Stock transfer initiated
 */
router.post('/transfer', ...requirePermission(STOCK_PERMISSIONS.TRANSFER_STOCK), rateLimitMiddleware, stockController.transferStock);

/**
 * @swagger
 * /api/stock/transfer/{transfer_id}/complete:
 *   post:
 *     summary: Complete a pending stock transfer
 *     tags: [Stock]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: transfer_id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Transfer ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               actual_quantity:
 *                 type: integer
 *               received_notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Stock transfer completed
 */
router.post('/transfer/:transfer_id/complete', ...requirePermission(STOCK_PERMISSIONS.TRANSFER_STOCK),rateLimitMiddleware, stockController.completeTransfer);

/**
 * @swagger
 * /api/stock/transfers/pending:
 *   get:
 *     summary: Get pending stock transfers
 *     tags: [Stock]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: branch_id
 *         schema:
 *           type: integer
 *         description: Filter by branch (optional)
 *     responses:
 *       200:
 *         description: Pending transfers
 */
router.get('/transfers/pending', authenticateToken, stockController.getPendingTransfers);

/**
 * @swagger
 * /api/stock/analytics:
 *   get:
 *     summary: Get stock movement analytics
 *     tags: [Stock]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: integer
 *           default: 30
 *         description: Analysis period in days
 *     responses:
 *       200:
 *         description: Stock analytics
 */
router.get('/analytics', authenticateToken, stockController.getStockAnalytics);

/**
 * @swagger
 * /api/stock/notifications:
 *   get:
 *     summary: Get unread stock notifications for the authenticated business
 *     tags: [Stock]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Number of notifications to return
 *     responses:
 *       200:
 *         description: Unread notifications (filtered by business_id)
 */
router.get('/notifications', ...requirePermission(STOCK_PERMISSIONS.MANAGE_STOCK), stockController.getNotifications);

/**
 * @swagger
 * /api/stock/notifications/{id}/read:
 *   post:
 *     summary: Mark notification as read (for the authenticated business)
 *     tags: [Stock]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Notification ID
 *     responses:
 *       200:
 *         description: Notification marked as read (filtered by business_id)
 */
router.post('/notifications/:id/read', ...requirePermission(STOCK_PERMISSIONS.MANAGE_STOCK), rateLimitMiddleware, stockController.markNotificationAsRead);

/**
 * @swagger
 * /api/stock/notifications/stats:
 *   get:
 *     summary: Get notification statistics for the authenticated business
 *     tags: [Stock]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Notification statistics (filtered by business_id)
 */
router.get('/notifications/stats', ...requirePermission(STOCK_PERMISSIONS.MANAGE_STOCK), stockController.getNotificationStats);

module.exports = router;
