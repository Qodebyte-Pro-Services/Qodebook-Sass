// expenseCategoryRoutes.js
const express = require('express');
const router = express.Router();
const controller = require('../controllers/expenseCategoryController');
const auth = require('../middlewares/authMiddleware');
const { requirePermission, requireAuthOnly } = require('../utils/routeHelpers');
const { FINANCIAL_PERMISSIONS } = require('../constants/permissions');

/**
 * @swagger
 * /api/expense-categories:
 *   post:
 *     summary: Create an expense category
 *     tags: [ExpenseCategory]
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
 *         description: Expense category created
 */
router.post('/', ...requirePermission(FINANCIAL_PERMISSIONS.CREATE_EXPENSE_CATEGORY), controller.create);

/**
 * @swagger
 * /api/expense-categories:
 *   get:
 *     summary: List all expense categories
 *     tags: [ExpenseCategory]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of expense categories
 */
router.get('/', ...requireAuthOnly(), controller.list);

/**
 * @swagger
 * /api/expense-categories/{id}:
 *   put:
 *     summary: Update an expense category
 *     tags: [ExpenseCategory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Expense category ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Expense category updated
 */
router.put('/:id', ...requirePermission(FINANCIAL_PERMISSIONS.UPDATE_EXPENSE_CATEGORY), controller.update);

/**
 * @swagger
 * /api/expense-categories/{id}:
 *   delete:
 *     summary: Delete an expense category
 *     tags: [ExpenseCategory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Expense category ID
 *     responses:
 *       200:
 *         description: Expense category deleted
 */
router.delete('/:id', ...requirePermission(FINANCIAL_PERMISSIONS.DELETE_EXPENSE_CATEGORY), controller.delete);

module.exports = router;
