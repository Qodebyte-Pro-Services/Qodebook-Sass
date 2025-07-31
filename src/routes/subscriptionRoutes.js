// subscriptionRoutes.js
const express = require('express');
const router = express.Router();
const controller = require('../controllers/subscriptionController');
const auth = require('../middlewares/authMiddleware');

/**
 * @swagger
 * /api/subscription/subscribe:
 *   post:
 *     summary: Subscribe to a plan
 *     tags: [Subscription]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Subscribed to plan
 */
router.post('/subscribe', auth.authenticateToken, controller.subscribe);

/**
 * @swagger
 * /api/subscription/status:
 *   get:
 *     summary: View subscription status
 *     tags: [Subscription]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Subscription status
 */
router.get('/status', auth.authenticateToken, controller.status);

/**
 * @swagger
 * /api/subscription/cancel:
 *   post:
 *     summary: Cancel subscription
 *     tags: [Subscription]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Subscription cancelled
 */
router.post('/cancel', auth.authenticateToken, controller.cancel);

module.exports = router;
