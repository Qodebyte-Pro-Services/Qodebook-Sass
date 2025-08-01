
// budgetRoutes.js
const express = require('express');
const router = express.Router();
const controller = require('../controllers/budgetController');
const auth = require('../middlewares/authMiddleware');

/**
 * @swagger
 * /api/budgets/{category_id}/remaining:
 *   get:
 *     summary: Get remaining budget for a category (including spillover)
 *     tags: [Budget]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: category_id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Expense category ID
 *       - in: query
 *         name: business_id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Business ID
 *     responses:
 *       200:
 *         description: Remaining budget
 */
router.get('/:category_id/remaining', auth.authenticateToken, controller.remaining);

/**
 * @swagger
 * /api/budgets:
 *   post:
 *     summary: Create a budget
 *     tags: [Budget]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Budget created
 */
router.post('/', auth.authenticateToken, controller.create);

/**
 * @swagger
 * /api/budgets:
 *   get:
 *     summary: List all budgets
 *     tags: [Budget]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of budgets
 */
router.get('/', auth.authenticateToken, controller.list);

/**
 * @swagger
 * /api/budgets/{id}:
 *   put:
 *     summary: Update a budget
 *     tags: [Budget]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Budget ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Budget updated
 */
router.put('/:id', auth.authenticateToken, controller.update);

/**
 * @swagger
 * /api/budgets/{id}:
 *   delete:
 *     summary: Delete a budget
 *     tags: [Budget]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Budget ID
 *     responses:
 *       200:
 *         description: Budget deleted
 */
router.delete('/:id', auth.authenticateToken, controller.delete);

module.exports = router;
