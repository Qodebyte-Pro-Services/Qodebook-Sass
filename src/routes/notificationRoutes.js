// notificationRoutes.js
const express = require('express');
const router = express.Router();
const controller = require('../controllers/notificationController');
const auth = require('../middlewares/authMiddleware');
const { requirePermission } = require('../utils/routeHelpers');
const { STOCK_PERMISSIONS } = require('../constants/permissions');



/**
 * @swagger
 * /api/notifications:
 *   post:
 *     summary: Create a new notification and send email (optional)
 *     tags: [Notification]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *               message:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       201:
 *         description: Notification created
 *       500:
 *         description: Failed to create notification or send email
 */
router.post('/', ...requirePermission(STOCK_PERMISSIONS.MANAGE_STOCK_NOTIFICATIONS), controller.createAndNotify);


/**
 * @swagger
 * /api/notifications:
 *   get:
 *     summary: Get notifications
 *     tags: [Notification]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of notifications
 */
router.get('/', ...requirePermission(STOCK_PERMISSIONS.VIEW_STOCK_HISTORY), controller.getNotifications);


/** * @swagger
 * /api/notifications/unread-count:
 *   get:
 *    summary: Get count of unread notifications
 *    tags: [Notification]
 *   security:
 *     - bearerAuth: []
 *   responses:
 *    200:
 *     description: Unread notifications count
 */
router.get('/unread-count', ...requirePermission(STOCK_PERMISSIONS.VIEW_STOCK_HISTORY), controller.getUnreadCount);

/**
 * @swagger
 * /api/notifications/mark-read:
 *   post:
 *     summary: Mark notifications as read
 *     tags: [Notification]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *     responses:
 *       200:
 *         description: Notifications marked as read
 */
router.patch('/:id/read',...requirePermission(STOCK_PERMISSIONS.MANAGE_STOCK_NOTIFICATIONS), controller.markRead);

/**
 * @swagger
 * /api/notifications/read-all:
 *   patch:
 *      summary: Mark all notifications as read
 *      tags: [Notification]
 *      security:
 *         - bearerAuth: []
 *      responses:
 *        200:
 *          description: All notifications marked as read
 */
router.patch('/read-all',...requirePermission(STOCK_PERMISSIONS.MANAGE_STOCK_NOTIFICATIONS), controller.markAllRead);

module.exports = router;
