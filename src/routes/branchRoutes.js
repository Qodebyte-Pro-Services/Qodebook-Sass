/**
 * @swagger
 * tags:
 *   - name: Branch
 *     description: Branch management endpoints (all require Bearer token)
 * securitySchemes:
 *   bearerAuth:
 *     type: http
 *     scheme: bearer
 *     bearerFormat: JWT
 * security:
 *   - bearerAuth: []
 *
 * All endpoints in this file require a valid JWT Bearer token in the Authorization header:
 *   Authorization: Bearer <token>
 */
const express = require('express');
const router = express.Router();
const { requirePermission, requireAuth } = require('../utils/routeHelpers');
const { BUSINESS_PERMISSIONS } = require('../constants/permissions');
const { validateBranch, validateBranchUpdate } = require('../middlewares/validateInput');
const branchController = require('../controllers/branchController');


/**
 * @swagger
 * /api/branches/create:
 *   post:
 *     summary: Create a new branch
 *     tags: [Branch]
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
 *                 type: string
 *               branch_name:
 *                 type: string
 *               location:
 *                 type: string
 *               phone:
 *                 type: string
 *     responses:
 *       201:
 *         description: Branch created successfully
 *       409:
 *         description: Branch name or phone already exists
 */
router.post('/create', ...requirePermission(BUSINESS_PERMISSIONS.CREATE_BRANCH), validateBranch, branchController.createBranch);


/**
 * @swagger
 * /api/branches:
 *   get:
 *     summary: List all branches for the authenticated user
 *     tags: [Branch]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of branches
 */
router.get('/', ...requirePermission(), branchController.listBranches);


/**
 * @swagger
 * /api/branches/{id}:
 *   get:
 *     summary: Get a branch by ID
 *     tags: [Branch]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Branch ID
 *     responses:
 *       200:
 *         description: Branch found
 *       404:
 *         description: Branch not found
 */
router.get('/:id', ...requirePermission(), branchController.getBranch);


/**
 * @swagger
 * /api/branches/{id}:
 *   put:
 *     summary: Update a branch by ID
 *     tags: [Branch]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Branch ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               branch_name:
 *                 type: string
 *               address:
 *                 type: string
 *               phone:
 *                 type: string
 *     responses:
 *       200:
 *         description: Branch updated successfully
 *       404:
 *         description: Branch not found
 *       409:
 *         description: Branch name or phone already exists
 */
router.put('/:id', ...requirePermission(BUSINESS_PERMISSIONS.UPDATE_BRANCH), validateBranchUpdate, branchController.updateBranch);


/**
 * @swagger
 * /api/branches/{id}:
 *   delete:
 *     summary: Delete a branch by ID
 *     tags: [Branch]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Branch ID
 *     responses:
 *       200:
 *         description: Branch deleted successfully
 *       404:
 *         description: Branch not found
 */
router.delete('/:id', ...requirePermission(BUSINESS_PERMISSIONS.DELETE_BRANCH), branchController.deleteBranch);


/**
 * @swagger
 * /api/branches/business/{businessId}:
 *   get:
 *     summary: List all branches for a business
 *     tags: [Branch]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: businessId
 *         schema:
 *           type: string
 *         required: true
 *         description: Business ID
 *     responses:
 *       200:
 *         description: List of branches for the business
 *       404:
 *         description: Business not found
 */
router.get('/business/:businessId', ...requirePermission(), branchController.listBranchesByBusiness);


/**
 * @swagger
 * /api/branches/business/{businessId}/{id}:
 *   get:
 *     summary: Get a branch by ID for a business
 *     tags: [Branch]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: businessId
 *         schema:
 *           type: string
 *         required: true
 *         description: Business ID
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Branch ID
 *     responses:
 *       200:
 *         description: Branch found
 *       404:
 *         description: Branch not found
 */
router.get('/business/:businessId/:id', ...requirePermission(), branchController.getBranchByBusiness);

module.exports = router;
