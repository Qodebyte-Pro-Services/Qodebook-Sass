
// budgetRoutes.js
const express = require('express');
const router = express.Router();
const controller = require('../controllers/budgetController');
const { requirePermission, requireAuthOnly } = require('../utils/routeHelpers');
const { FINANCIAL_PERMISSIONS } = require('../constants/permissions');

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
router.get('/:category_id/remaining', ...requireAuthOnly(), controller.remaining);

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
router.post('/', ...requirePermission(FINANCIAL_PERMISSIONS.CREATE_BUDGET), controller.create);

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
router.get('/', ...requireAuthOnly(), controller.list);

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
router.put('/:id', ...requirePermission(FINANCIAL_PERMISSIONS.UPDATE_BUDGET), controller.update);

/**
 * @swagger
 * /api/budgets/{id}/approve:
 *   post:
 *     summary: Approve a budget (requires approve_budget permission)
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
 *         description: Budget approved
 */
router.put('/:id/approve', ...requirePermission(FINANCIAL_PERMISSIONS.APPROVE_BUDGET), controller.approve);

/**
 * @swagger
 * /api/budgets/{id}/reject:
 *   post:
 *     summary: Reject a budget (requires reject_budget permission)
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
 *             properties:
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Budget rejected
 */
router.put('/:id/reject', ...requirePermission(FINANCIAL_PERMISSIONS.REJECT_BUDGET), controller.reject);

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
