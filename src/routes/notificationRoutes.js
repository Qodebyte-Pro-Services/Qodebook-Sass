// notificationRoutes.js
const express = require('express');
const router = express.Router();
const controller = require('../controllers/notificationController');
const auth = require('../middlewares/authMiddleware');

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
router.get('/', auth.authenticateToken, controller.getNotifications);

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
router.post('/mark-read', auth.authenticateToken, controller.markRead);

module.exports = router;
