const express = require('express');
const router = express.Router();
const { requirePermission, requireAuthOnly } = require('../utils/routeHelpers');
const { PRODUCT_PERMISSIONS } = require('../constants/permissions');
// const { validateCategory } = require('../middlewares/validateInput');
const categoryController = require('../controllers/categoryController');
const { rateLimitMiddleware } = require('../middlewares/rateLimitMiddleware');

/**
 * @swagger
 * /api/categories:
 *   post:
 *     summary: Create category
 *     tags: [Category]
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
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Category created
 *       409:
 *         description: Category name already exists
 */
router.post('/', ...requirePermission(PRODUCT_PERMISSIONS.CREATE_CATEGORY), rateLimitMiddleware, categoryController.createCategory);

/**
 * @swagger
 * /api/categories:
 *   get:
 *     summary: List all categories
 *     tags: [Category]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: business_id
 *         schema:
 *           type: string
 *         required: false
 *         description: Filter by business
 *     responses:
 *       200:
 *         description: List of categories
 */
router.get('/', ...requirePermission(PRODUCT_PERMISSIONS.VIEW_PRODUCT_CATEGORIES), categoryController.listCategories);

/**
 * @swagger
 * /api/categories/{id}:
 *   put:
 *     summary: Update category
 *     tags: [Category]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Category ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Category updated
 *       409:
 *         description: Category name already exists
 */
router.put('/:id', ...requirePermission(PRODUCT_PERMISSIONS.UPDATE_CATEGORY), rateLimitMiddleware, categoryController.updateCategory);

/**
 * @swagger
 * /api/categories/{id}:
 *   delete:
 *     summary: Delete category
 *     tags: [Category]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Category ID
 *     responses:
 *       200:
 *         description: Category deleted
 */
router.delete('/:id', ...requirePermission(PRODUCT_PERMISSIONS.DELETE_CATEGORY), rateLimitMiddleware, categoryController.deleteCategory);

/**
 * @swagger
 * /api/categories/{id}:
 *   get:
 *     summary: Get category by ID
 *     tags: [Category]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Category ID
 *     responses:
 *       200:
 *         description: Category found
 *       404:
 *         description: Category not found
 */
router.get('/:id', ...requireAuthOnly(), categoryController.getCategory);

/**
 * @swagger
 * /api/categories/business/{business_id}:
 *   get:
 *     summary: Get all categories for a business
 *     tags: [Category]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: business_id
 *         schema:
 *           type: string
 *         required: true
 *         description: Business ID
 *     responses:
 *       200:
 *         description: List of categories for the business
 */
router.get('/business/:business_id', ...requireAuthOnly(), categoryController.getCategoriesByBusiness);

module.exports = router;
