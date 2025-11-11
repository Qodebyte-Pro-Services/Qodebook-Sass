const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middlewares/authMiddleware');
const customerController = require('../controllers/customerController');
const { rateLimitMiddleware } = require('../middlewares/rateLimitMiddleware');
const { requirePermission } = require('../utils/routeHelpers');
const { CUSTOMER_PERMISSIONS } = require('../constants/permissions');

/**
 * @swagger
 * /api/customers:
 *   post:
 *     summary: Add a customer
 *     tags: [Customer]
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
 *                 type: integer
 *               name:
 *                 type: string
 *               phone:
 *                 type: string
 *               email:
 *                 type: string
 *     responses:
 *       201:
 *         description: Customer added
 */
router.post('/', authenticateToken, customerController.addCustomer);

/**
 * @swagger
 * /api/customers:
 *   get:
 *     summary: List all customers
 *     tags: [Customer]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of customers
 */
router.get('/', authenticateToken, customerController.listCustomers);

/**
 * @swagger
 * /api/customer/{id}/orders:
 *   get:
 *     summary: Get orders by a customer
 *     tags: [Customer]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Customer ID
 *     responses:
 *       200:
 *         description: List of orders for customer
 */
router.get('/:id/orders', authenticateToken, customerController.getCustomerOrders);

/**
 * @swagger
 * /api/customers/{id}:
 *   get:
 *     summary: Get a customer
 *     tags: [Customer]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Customer ID
 *     responses:
 *       200:
 *         description: Customer details
 */
router.get('/:id', ...requirePermission(CUSTOMER_PERMISSIONS.CREATE_CUSTOMER), rateLimitMiddleware, customerController.getCustomer);

/**
 * @swagger
 * /api/customers/{id}:
 *   put:
 *     summary: Update a customer
 *     tags: [Customer]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Customer ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               phone:
 *                 type: string
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Customer updated
 */
router.put('/:id', ...requirePermission(CUSTOMER_PERMISSIONS.UPDATE_CUSTOMER), rateLimitMiddleware, customerController.updateCustomer);

/**
 * @swagger
 * /api/customers/{id}:
 *   delete:
 *     summary: Delete a customer
 *     tags: [Customer]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Customer ID
 *     responses:
 *       200:
 *         description: Customer deleted
 */
router.delete('/:id', ...requirePermission(CUSTOMER_PERMISSIONS.DELETE_CUSTOMER), rateLimitMiddleware, customerController.deleteCustomer);



module.exports = router;
