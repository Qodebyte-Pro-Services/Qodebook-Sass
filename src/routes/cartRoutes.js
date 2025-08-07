
const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const { authenticateCustomer } = require('../middlewares/authMiddleware');

/**
 * @swagger
 * /api/shop/cart/add:
 *   post:
 *     summary: Add item to cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               variant_id:
 *                 type: integer
 *               quantity:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Item added to cart
 */
router.post('/add', authenticateCustomer, cartController.addToCart);

/**
 * @swagger
 * /api/shop/cart/remove:
 *   post:
 *     summary: Remove item from cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               variant_id:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Item removed from cart
 */
router.post('/remove', authenticateCustomer, cartController.removeFromCart);

/**
 * @swagger
 * /api/shop/cart:
 *   get:
 *     summary: Get current cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current cart and items
 */
router.get('/', authenticateCustomer, cartController.getCart);

module.exports = router;
