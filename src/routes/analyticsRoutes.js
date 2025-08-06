
const express = require('express');
const router = express.Router();
const controller = require('../controllers/analyticsController');
const auth = require('../middlewares/authMiddleware');

/**
 * @swagger
 * /api/finance/overview:
 *   get:
 *     summary: Get finance analytics overview
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Finance analytics overview data
 */
router.get('/overview', auth.authenticateToken, controller.overview);

module.exports = router;
