// expenseRoutes.js
const express = require('express');
const router = express.Router();
const controller = require('../controllers/expenseController');
const auth = require('../middlewares/authMiddleware');

/**
 * @swagger
 * /api/expenses:
 *   post:
 *     summary: Create an expense
 *     tags: [Expense]
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
 *         description: Expense created
 */
router.post('/', auth.authenticateToken, controller.create);

/**
 * @swagger
 * /api/expenses:
 *   get:
 *     summary: List all expenses
 *     tags: [Expense]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of expenses
 */
router.get('/', auth.authenticateToken, controller.list);

/**
 * @swagger
 * /api/expenses/{id}:
 *   put:
 *     summary: Update an expense
 *     tags: [Expense]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Expense ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Expense updated
 */
router.put('/:id', auth.authenticateToken, controller.update);

/**
 * @swagger
 * /api/expenses/{id}:
 *   delete:
 *     summary: Delete an expense
 *     tags: [Expense]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Expense ID
 *     responses:
 *       200:
 *         description: Expense deleted
 */
router.delete('/:id', auth.authenticateToken, controller.delete);

module.exports = router;
