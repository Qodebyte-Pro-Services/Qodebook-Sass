// src/routes/wishlistRoutes.js
const express = require('express');
const router = express.Router();
const wishlistController = require('../controllers/wishlistController');
const { authenticateCustomer } = require('../middlewares/authMiddleware');

router.post('/add', authenticateCustomer, wishlistController.addToWishlist);
router.post('/remove', authenticateCustomer, wishlistController.removeFromWishlist);
router.get('/', authenticateCustomer, wishlistController.getWishlist);

module.exports = router;
