// importRoutes.js
const express = require('express');
const router = express.Router();
const controller = require('../controllers/importController');
const auth = require('../middlewares/authMiddleware');

/**
 * @swagger
 * /api/products/import/import:
 *   post:
 *     summary: Bulk import products via CSV/Excel
 *     tags: [ProductImport]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Import started
 */
router.post('/import', auth.authenticateToken, controller.upload);

/**
 * @swagger
 * /api/products/import/template:
 *   get:
 *     summary: Download product import template
 *     tags: [ProductImport]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Template file
 */
router.get('/import/template', auth.authenticateToken, controller.template);

/**
 * @swagger
 * /api/products/import/history:
 *   get:
 *     summary: Get product import history
 *     tags: [ProductImport]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Import history
 */
router.get('/import/history', auth.authenticateToken, controller.history);

module.exports = router;
