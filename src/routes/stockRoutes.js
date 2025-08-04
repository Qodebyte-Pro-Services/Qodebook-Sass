
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middlewares/authMiddleware');
const stockController = require('../controllers/stockController');
/**
 * @swagger
 * /api/stock/adjust:
 *   post:
 *     summary: Manually adjust stock for a variant
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
 *               new_quantity:
 *                 type: integer
 *               type:
 *                 type: string
 *                 enum: [adjustment, transfer, damage, return]
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Stock adjusted
 */
router.post('/adjust', authenticateToken, stockController.adjustStock);

/**
 * @swagger
 * /api/stock/history:
 *   get:
 *     summary: Get full stock movement history for a variant
 *     tags: [Stock]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: variant_id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Variant ID
 *     responses:
 *       200:
 *         description: Stock movement history
 */
router.get('/history', authenticateToken, stockController.getStockHistory);

/**
 * @swagger
 * /api/stock/restock:
 *   post:
 *     summary: Restock a variant
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
 *               quantity:
 *                 type: integer
 *               cost_price:
 *                 type: number
 *               expiry_date:
 *                 type: string
 *                 format: date
 *               note:
 *                 type: string
 *               supplier_id:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Variant restocked
 */
router.post('/restock', authenticateToken, stockController.restockVariant);

/**
 * @swagger
 * /api/stock/movement:
 *   get:
 *     summary: Get all stock movement logs
 *     tags: [Stock]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Stock movement logs
 */
router.get('/movement', authenticateToken, stockController.getStockMovements);

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
router.get('/movement/variant/:id', authenticateToken, stockController.getStockMovementsByVariant);

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
router.delete('/movement/:id', authenticateToken, stockController.deleteStockMovement);

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
router.get('/status/low', authenticateToken, stockController.getLowStock);

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
router.get('/status/out-of-stock', authenticateToken, stockController.getOutOfStock);

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
router.get('/status/expired', authenticateToken, stockController.getExpiredStock);

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
router.get('/status/recent', authenticateToken, stockController.getRecentlyRestocked);

/**
 * @swagger
 * /api/stock/status/fast-moving:
 *   get:
 *     summary: Get fast-moving items
 *     tags: [Stock]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Fast-moving items
 */
router.get('/status/fast-moving', authenticateToken, stockController.getFastMoving);

/**
 * @swagger
 * /api/stock/status/slow-moving:
 *   get:
 *     summary: Get slow-moving items
 *     tags: [Stock]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Slow-moving items
 */
router.get('/status/slow-moving', authenticateToken, stockController.getSlowMoving);

module.exports = router;
