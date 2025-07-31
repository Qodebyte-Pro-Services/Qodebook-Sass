const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middlewares/authMiddleware');
const serviceCategoryController = require('../controllers/serviceCategoryController');

/**
 * @swagger
 * /api/service-categories:
 *   post:
 *     summary: Add a service category
 *     tags: [ServiceCategory]
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
 *     responses:
 *       201:
 *         description: Service category added
 */
router.post('/', authenticateToken, serviceCategoryController.addCategory);

/**
 * @swagger
 * /api/service-categories:
 *   get:
 *     summary: List all service categories
 *     tags: [ServiceCategory]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of service categories
 */
router.get('/', authenticateToken, serviceCategoryController.listCategories);

module.exports = router;
