
/**
 * @swagger
 * tags:
 *   - name: Business
 *     description: Business management endpoints (all require Bearer token)
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
const { validateBusiness } = require('../middlewares/validateInput');
const upload = require('../middlewares/upload');
const businessController = require('../controllers/businessController');




/**
 * @swagger
 * /api/business/create:
 *   post:
 *     summary: Create a new business
 *     tags: [Business]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               business_name:
 *                 type: string
 *               business_type:
 *                 type: string
 *               address:
 *                 type: string
 *               business_phone:
 *                 type: string
 *               logo:
 *                 type: string
 *                 format: binary
 *               logo_url:
 *                 type: string
 *                 description: Optional external logo URL
 *     responses:
 *       201:
 *         description: Business created successfully
 *       409:
 *         description: Business name or phone already exists
 */
router.post('/create', authenticateToken, upload.single('logo'), validateBusiness, businessController.createBusiness);


/**
 * @swagger
 * /api/business:
 *   get:
 *     summary: List all businesses for the authenticated user
 *     tags: [Business]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of businesses
 */
router.get('/', authenticateToken, businessController.listBusinesses);


/**
 * @swagger
 * /api/business/{id}:
 *   get:
 *     summary: Get a business by ID
 *     tags: [Business]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Business ID
 *     responses:
 *       200:
 *         description: Business found
 *       404:
 *         description: Business not found
 */
router.get('/:id', authenticateToken, businessController.getBusiness);


/**
 * @swagger
 * /api/business/{id}:
 *   put:
 *     summary: Update a business by ID
 *     tags: [Business]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Business ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               business_name:
 *                 type: string
 *               business_type:
 *                 type: string
 *               address:
 *                 type: string
 *               business_phone:
 *                 type: string
 *               logo:
 *                 type: string
 *                 format: binary
 *               logo_url:
 *                 type: string
 *                 description: Optional external logo URL
 *     responses:
 *       200:
 *         description: Business updated successfully
 *       404:
 *         description: Business not found
 *       409:
 *         description: Business name or phone already exists
 */
router.put('/:id', authenticateToken, upload.single('logo'), validateBusiness, businessController.updateBusiness);


/**
 * @swagger
 * /api/business/{id}:
 *   delete:
 *     summary: Delete a business by ID
 *     tags: [Business]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Business ID
 *     responses:
 *       200:
 *         description: Business deleted successfully
 *       404:
 *         description: Business not found
 */
router.delete('/:id', authenticateToken, businessController.deleteBusiness);

module.exports = router;
