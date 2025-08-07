// src/routes/reviewRoutes.js
const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { authenticateCustomer } = require('../middlewares/authMiddleware');

router.post('/', authenticateCustomer, reviewController.addReview);
router.get('/:product_id', reviewController.getReviews);

module.exports = router;
