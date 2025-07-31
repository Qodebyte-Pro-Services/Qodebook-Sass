// barcodeRoutes.js
const express = require('express');
const router = express.Router();
const controller = require('../controllers/barcodeController');
const auth = require('../middlewares/authMiddleware');

router.get('/:variantId', auth.authenticateToken, controller.generate);
router.get('/:variantId/download', auth.authenticateToken, controller.download);

module.exports = router;
