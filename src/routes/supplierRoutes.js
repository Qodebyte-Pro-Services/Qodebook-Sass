const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middlewares/authMiddleware');
const supplierController = require('../controllers/supplierController');

/**
 * @swagger
 * /api/suppliers:
 *   post:
 *     summary: Add a supplier
 *     tags: [Supplier]
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
 *               contact:
 *                 type: string
 *     responses:
 *       201:
 *         description: Supplier added
 */
router.post('/', authenticateToken, supplierController.addSupplier);

/**
 * @swagger
 * /api/suppliers:
 *   get:
 *     summary: List all suppliers
 *     tags: [Supplier]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of suppliers
 */
router.get('/', authenticateToken, supplierController.listSuppliers);

/**
 * @swagger
 * /api/suppliers/business/{id}:
 *   get:
 *     summary: Get suppliers for a business
 *     tags: [Supplier]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Business ID
 *     responses:
 *       200:
 *         description: List of suppliers for business
 */
router.get('/business/:id', authenticateToken, supplierController.getSuppliersByBusiness);

/**
 * @swagger
 * /api/suppliers/{id}:
 *   put:
 *     summary: Update a supplier
 *     tags: [Supplier]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Supplier ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               contact:
 *                 type: string
 *     responses:
 *       200:
 *         description: Supplier updated
 */
router.put('/:id', authenticateToken, supplierController.updateSupplier);

/**
 * @swagger
 * /api/suppliers/{id}:
 *   delete:
 *     summary: Delete a supplier
 *     tags: [Supplier]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Supplier ID
 *     responses:
 *       200:
 *         description: Supplier deleted
 */
router.delete('/:id', authenticateToken, supplierController.deleteSupplier);

/**
 * @swagger
 * /api/suppliers/stock-movement:
 *   get:
 *     summary: Get all supply entries (stock movement by suppliers)
 *     tags: [Supplier]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of supply entries
 */
router.get('/stock-movement', authenticateToken, supplierController.getSupplierStockMovements);

module.exports = router;
