// src/routes/analyticsUnifiedRoutes.js
const express = require('express');
const router = express.Router();
const analyticsUnifiedController = require('../controllers/analyticsUnifiedController');
const tenantMiddleware = require('../middlewares/tenantMiddleware');
const { authenticateToken } = require('../middlewares/authMiddleware');

// All analytics endpoints require auth and tenant context
router.get('/sales', authenticateToken, tenantMiddleware, analyticsUnifiedController.salesOverview);
router.get('/inventory', authenticateToken, tenantMiddleware, analyticsUnifiedController.inventoryOverview);
router.get('/customers', authenticateToken, tenantMiddleware, analyticsUnifiedController.customerOverview);

module.exports = router;
