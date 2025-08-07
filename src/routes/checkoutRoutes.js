const express = require('express');
const router = express.Router();
const checkoutController = require('../controllers/checkoutController');
const { authenticateCustomer } = require('../middlewares/authMiddleware');


/**
 * @swagger
 * /api/shop/checkout:
 *   post:
 *     summary: Checkout and place order from cart
 *     tags: [Checkout]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               shipping_address:
 *                 type: string
 *               payment_method:
 *                 type: string
 *     responses:
 *       201:
 *         description: Order placed
 */
router.post('/', authenticateCustomer, checkoutController.checkout);

module.exports = router;
