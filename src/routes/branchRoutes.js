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
const { authenticateToken } = require('../middlewares/authMiddleware');
const { validateBranch, validateBranchUpdate } = require('../middlewares/validateInput');
const branchController = require('../controllers/branchController');


/**
 * @swagger
 * /api/branch/create:
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
 *               address:
 *                 type: string
 *               phone:
 *                 type: string
 *     responses:
 *       201:
 *         description: Branch created successfully
 *       409:
 *         description: Branch name or phone already exists
 */
router.post('/create', authenticateToken, validateBranch, branchController.createBranch);


/**
 * @swagger
 * /api/branch:
 *   get:
 *     summary: List all branches for the authenticated user
 *     tags: [Branch]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of branches
 */
router.get('/', authenticateToken, branchController.listBranches);


/**
 * @swagger
 * /api/branch/{id}:
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
router.get('/:id', authenticateToken, branchController.getBranch);


/**
 * @swagger
 * /api/branch/{id}:
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
router.put('/:id', authenticateToken, validateBranchUpdate, branchController.updateBranch);


/**
 * @swagger
 * /api/branch/{id}:
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
router.delete('/:id', authenticateToken, branchController.deleteBranch);


/**
 * @swagger
 * /api/branch/business/{businessId}:
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
router.get('/business/:businessId', authenticateToken, branchController.listBranchesByBusiness);


/**
 * @swagger
 * /api/branch/business/{businessId}/{id}:
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
router.get('/business/:businessId/:id', authenticateToken, branchController.getBranchByBusiness);

module.exports = router;
