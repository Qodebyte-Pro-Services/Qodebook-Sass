// expenseRoutes.js
const express = require('express');
const router = express.Router();
const controller = require('../controllers/expenseController');
const auth = require('../middlewares/authMiddleware');
const upload = require('../middlewares/upload');
const permission = require('../middlewares/permissionMiddleware');

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
router.post('/', auth.authenticateToken, upload.single('receipt'), controller.create);
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

router.post('/:id/approve', auth.authenticateToken, permission('approve_expense'), controller.approve);

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

router.post('/:id/reject', auth.authenticateToken, permission('approve_expense'), controller.reject);

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
