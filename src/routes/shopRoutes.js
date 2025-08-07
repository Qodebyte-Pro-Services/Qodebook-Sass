const express = require('express');
const router = express.Router();
const shopController = require('../controllers/shopController');
const { authenticateCustomer } = require('../middlewares/authMiddleware');



/**
 * @swagger
 * /api/shop/products:
 *   get:
 *     summary: List all products (with filters, pagination, search)
 *     tags: [Shop]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of products
 */
router.get('/products', authenticateCustomer, shopController.listProducts);

/**
 * @swagger
 * /api/shop/products/{id}:
 *   get:
 *     summary: Get product details (with variants)
 *     tags: [Shop]
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
 *         description: Product details
 */
router.get('/products/:id', authenticateCustomer, shopController.getProduct);

/**
 * @swagger
 * /api/shop/variants/{id}:
 *   get:
 *     summary: Get variant details
 *     tags: [Shop]
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
 *         description: Variant details
 */
router.get('/variants/:id', authenticateCustomer, shopController.getVariant);

module.exports = router;
