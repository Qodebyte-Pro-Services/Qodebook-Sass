// realtimeRoutes.js
const express = require('express');
const router = express.Router();
const controller = require('../controllers/realtimeController');
const auth = require('../middlewares/authMiddleware');

/**
 * @swagger
 * /api/realtime/events:
 *   get:
 *     summary: Get real-time events (SSE/WebSocket placeholder)
 *     tags: [Realtime]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Real-time events stream
 */
router.get('/events', auth.authenticateToken, controller.events);

module.exports = router;
