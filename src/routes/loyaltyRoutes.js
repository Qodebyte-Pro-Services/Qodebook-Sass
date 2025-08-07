// src/routes/loyaltyRoutes.js
const express = require('express');
const router = express.Router();
const loyaltyController = require('../controllers/loyaltyController');
const { authenticateCustomer } = require('../middlewares/authMiddleware');

router.get('/points', authenticateCustomer, loyaltyController.getPoints);
router.get('/transactions', authenticateCustomer, loyaltyController.getTransactions);
router.post('/redeem', authenticateCustomer, loyaltyController.redeemPoints);
// (Optional) For admin/testing: add points manually
router.post('/add', authenticateCustomer, loyaltyController.addPoints);

module.exports = router;
