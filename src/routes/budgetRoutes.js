
// budgetRoutes.js
const express = require('express');
const router = express.Router();
const controller = require('../controllers/budgetController');
const { requirePermission, requireAuthOnly } = require('../utils/routeHelpers');
const { FINANCIAL_PERMISSIONS } = require('../constants/permissions');



/**
 * @swagger
 * /api/budgets:
 *   post:
 *     summary: Create a new budget
 *     description: Creates a new budget record for a specific business and category. Automatically carries over any remaining balance from the previous budget period.
 *     tags: [Budget]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - business_id
 *               - category_id
 *               - amount
 *               - period_start
 *               - period_end
 *             properties:
 *               business_id:
 *                 type: string
 *                 description: ID of the business this budget belongs to
 *                 example: "b7bdf8c0-98b2-4d7a-9a52-13dc6b24e2f5"
 *               category_id:
 *                 type: string
 *                 description: ID of the expense category
 *                 example: "f1a34f55-4f3d-4e1b-b0ff-2b435b9c1234"
 *               amount:
 *                 type: number
 *                 description: Budget amount allocated for the period
 *                 example: 25000
 *               period_start:
 *                 type: string
 *                 format: date
 *                 description: Start date of the budget period
 *                 example: "2025-01-01"
 *               period_end:
 *                 type: string
 *                 format: date
 *                 description: End date of the budget period
 *                 example: "2025-01-31"
 *               budget_month:
 *                 type: string
 *                 description: Month of the budget (optional)
 *                 example: "January"
 *               budget_year:
 *                 type: integer
 *                 description: Year of the budget (optional)
 *                 example: 2025
 *     responses:
 *       201:
 *         description: Budget created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Budget created successfully."
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: "cbf87f0e-0a1c-46ab-8a6f-0f6a93196c14"
 *                     business_id:
 *                       type: string
 *                     category_id:
 *                       type: string
 *                     amount:
 *                       type: number
 *                       example: 25000
 *                     carry_over:
 *                       type: number
 *                       example: 1500
 *                     budget_spent:
 *                       type: number
 *                       example: 0
 *                     budget_remaining:
 *                       type: number
 *                       example: 26500
 *                     period_start:
 *                       type: string
 *                       format: date
 *                     period_end:
 *                       type: string
 *                       format: date
 *                     budget_month:
 *                       type: string
 *                     budget_year:
 *                       type: integer
 *                     status:
 *                       type: string
 *                       example: "pending"
 *       400:
 *         description: Missing required fields
 *       500:
 *         description: Failed to create budget
 */
router.post('/', ...requirePermission(FINANCIAL_PERMISSIONS.CREATE_BUDGET), controller.create);


/**
 * @swagger
 * /api/budgets/all:
 *   post:
 *     summary: Create budgets for all expense categories of a business
 *     tags: [Budget]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - business_id
 *               - period_start
 *               - period_end
 *               - budget_month
 *               - budget_year
 *             properties:
 *               business_id:
 *                 type: integer
 *               default_amount:
 *                 type: number
 *                 description: Default budget amount per category (optional)
 *               period_start:
 *                 type: string
 *               period_end:
 *                 type: string
 *               budget_month:
 *                 type: string
 *               budget_year:
 *                 type: string
 *     responses:
 *       201:
 *         description: Budgets created successfully for all categories.
 *       400:
 *         description: Missing required fields.
 *       500:
 *         description: Server error.
 */
router.post('/all', ...requirePermission(FINANCIAL_PERMISSIONS.CREATE_BUDGET), controller.budgetAllCat);

/**
 * @swagger
 * /api/budgets/transfer:
 *   post:
 *     summary: Transfer budget between two expense categories for a business
 *     tags: [Budget]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - business_id
 *               - from_category_id
 *               - to_category_id
 *               - amount
 *             properties:
 *               business_id:
 *                 type: integer
 *               from_category_id:
 *                 type: integer
 *               to_category_id:
 *                 type: integer
 *               amount:
 *                 type: number
 *               reason:
 *                 type: string
 *                 description: Optional description or reason for the transfer
 *     responses:
 *       200:
 *         description: Budget transfer successful
 *       400:
 *         description: Missing required fields or insufficient funds
 *       500:
 *         description: Server error
 */
router.post('/transfer', ...requirePermission(FINANCIAL_PERMISSIONS.MANAGE_BUDGETS), controller.transfer)

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
router.get('/', ...requirePermission(FINANCIAL_PERMISSIONS.VIEW_BUDGETS), controller.list);


/**
 * @swagger
 * /api/budgets/{id}:
 *   get:
 *     summary: Get detailed information of a specific budget
 *     tags: [Budget]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Budget details retrieved successfully
 *       404:
 *         description: Budget not found
 *       500:
 *         description: Server error
 */
router.get('/:id', ...requirePermission(FINANCIAL_PERMISSIONS.VIEW_BUDGETS), controller.getOne);

/**
 * @swagger
 * /api/budgets/{id}/manage:
 *   patch:
 *     summary: Approve or reject a budget
 *     description: Allows an authorized user or staff to approve or reject a budget request.
 *     tags: [Budget]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the budget to manage
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - action
 *               - role
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [approve, reject]
 *                 description: Action to take on the budget
 *               approverId:
 *                 type: string
 *                 description: ID of the approver (user or staff)
 *               role:
 *                 type: string
 *                 enum: [user, staff]
 *                 description: Role of the approver
 *               rejection_reason:
 *                 type: string
 *                 description: Reason for rejection (optional if approving)
 *     responses:
 *       200:
 *         description: Budget approval/rejection updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Budget approved successfully."
 *                 data:
 *                   type: object
 *       400:
 *         description: Invalid input or missing required fields
 *       404:
 *         description: Budget not found
 *       500:
 *         description: Server error
 */
router.patch(
  '/manage/:id',
  ...requirePermission(FINANCIAL_PERMISSIONS.MANAGE_BUDGETS),
  controller.manage
);

/**
 * @swagger
 * /api/budgets/{id}:
 *   put:
 *     summary: Update an existing budget
 *     description: Updates a budget record with new values such as amount, period, and category. Automatically recalculates remaining budget based on carry-over and previously spent amount.
 *     tags: [Budget]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Unique identifier of the budget to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - category_id
 *               - amount
 *               - period_start
 *               - period_end
 *             properties:
 *               category_id:
 *                 type: string
 *                 description: ID of the expense category for this budget
 *                 example: "c3f2b3b7-22f8-4e5d-b8c9-0e2f1f882d2a"
 *               amount:
 *                 type: number
 *                 description: Updated total budget amount
 *                 example: 50000
 *               period_start:
 *                 type: string
 *                 format: date
 *                 description: Start date of the updated budget period
 *                 example: "2025-02-01"
 *               period_end:
 *                 type: string
 *                 format: date
 *                 description: End date of the updated budget period
 *                 example: "2025-02-28"
 *               budget_month:
 *                 type: string
 *                 description: Budget month (optional)
 *                 example: "February"
 *               budget_year:
 *                 type: integer
 *                 description: Budget year (optional)
 *                 example: 2025
 *     responses:
 *       200:
 *         description: Budget updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Budget updated successfully."
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: "cbf87f0e-0a1c-46ab-8a6f-0f6a93196c14"
 *                     category_id:
 *                       type: string
 *                       example: "c3f2b3b7-22f8-4e5d-b8c9-0e2f1f882d2a"
 *                     amount:
 *                       type: number
 *                       example: 50000
 *                     period_start:
 *                       type: string
 *                       format: date
 *                     period_end:
 *                       type: string
 *                       format: date
 *                     carry_over:
 *                       type: number
 *                       example: 2000
 *                     budget_remaining:
 *                       type: number
 *                       example: 47000
 *                     budget_month:
 *                       type: string
 *                       example: "February"
 *                     budget_year:
 *                       type: integer
 *                       example: 2025
 *                     status:
 *                       type: string
 *                       example: "pending"
 *       400:
 *         description: Missing required fields
 *       404:
 *         description: Budget not found
 *       500:
 *         description: Failed to update budget
 */
router.put('/:id', ...requirePermission(FINANCIAL_PERMISSIONS.UPDATE_BUDGET), controller.update);



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
router.delete('/:id', ...requirePermission(FINANCIAL_PERMISSIONS.DELETE_BUDGET), controller.delete);

module.exports = router;
