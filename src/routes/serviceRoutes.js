const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middlewares/authMiddleware');
const serviceController = require('../controllers/serviceController');

/**
 * @swagger
 * /api/services:
 *   post:
 *     summary: Add a service
 *     tags: [Service]
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
 *               name:
 *                 type: string
 *               price:
 *                 type: number
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Service added
 */
router.post('/', authenticateToken, serviceController.addService);

/**
 * @swagger
 * /api/services:
 *   get:
 *     summary: List all services
 *     tags: [Service]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of services
 */
router.get('/', authenticateToken, serviceController.listServices);

module.exports = router;
