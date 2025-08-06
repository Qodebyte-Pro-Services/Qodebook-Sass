// expenseRoutes.js
const express = require('express');
const router = express.Router();
const controller = require('../controllers/expenseController');
const upload = require('../middlewares/upload');
const { requirePermission, requireAuthOnly } = require('../utils/routeHelpers');
const { FINANCIAL_PERMISSIONS } = require('../constants/permissions');
/**
 * @swagger
 * /api/expenses:
 *   post:
 *     summary: Create an expense (with optional receipt upload)
 *     tags: [Expense]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               business_id:
 *                 type: integer
 *               category_id:
 *                 type: integer
 *               staff_id:
 *                 type: integer
 *               amount:
 *                 type: number
 *               description:
 *                 type: string
 *               expense_date:
 *                 type: string
 *                 format: date
 *               receipt:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Expense created
 *       400:
 *         description: Missing required fields
 *       500:
 *         description: Failed to create expense
 */
router.post('/', ...requirePermission(FINANCIAL_PERMISSIONS.CREATE_EXPENSE), upload.single('receipt'), controller.create);
/**
 * @swagger
 * /api/expenses/{id}/approve:
 *   post:
 *     summary: Approve an expense (requires approve_expense permission)
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
 *         description: Expense approved
 *       404:
 *         description: Expense not found or not pending
 *       500:
 *         description: Failed to approve expense
 */

router.post('/:id/approve', ...requirePermission(FINANCIAL_PERMISSIONS.APPROVE_EXPENSE), controller.approve);

/**
 * @swagger
 * /api/expenses/{id}/reject:
 *   post:
 *     summary: Reject an expense (requires reject_expense permission)
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
 *         description: Expense rejected
 *       404:
 *         description: Expense not found or not pending
 *       500:
 *         description: Failed to reject expense
 */

router.post('/:id/reject', ...requirePermission(FINANCIAL_PERMISSIONS.REJECT_EXPENSE), controller.reject);

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
router.get('/', ...requireAuthOnly(), controller.list);

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
router.put('/:id', ...requirePermission(FINANCIAL_PERMISSIONS.UPDATE_EXPENSE), controller.update);

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
router.delete('/:id', ...requirePermission(FINANCIAL_PERMISSIONS.DELETE_EXPENSE), controller.delete);

/**
 * @swagger
 * /api/expenses/staff-salary:
 *   post:
 *     summary: Record a staff salary payment as an expense
 *     tags: [Expense]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [business_id, staff_id, amount, expense_date]
 *             properties:
 *               business_id: { type: string }
 *               staff_id: { type: string }
 *               amount: { type: number }
 *               expense_date: { type: string, format: date }
 *               description: { type: string }
 *     responses:
 *       201:
 *         description: Staff salary expense recorded
 */
router.post(
  '/staff-salary',
  ...requirePermission(FINANCIAL_PERMISSIONS.CREATE_STAFF_SALARY_EXPENSE),
  controller.createStaffSalary
);

module.exports = router;
