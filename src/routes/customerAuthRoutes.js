const express = require('express');
const router = express.Router();
const customerAuthController = require('../controllers/customerAuthController');
const { authenticateCustomer } = require('../middlewares/authMiddleware');


/**
 * @swagger
 * /api/shop/signup:
 *   post:
 *     summary: Customer signup
 *     tags: [CustomerAuth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: Signup successful
 */
router.post('/signup', customerAuthController.signup);

/**
 * @swagger
 * /api/shop/login:
 *   post:
 *     summary: Customer login
 *     tags: [CustomerAuth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 */
router.post('/login', customerAuthController.login);

/**
 * @swagger
 * /api/shop/me:
 *   get:
 *     summary: Get customer profile
 *     tags: [CustomerAuth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Customer profile
 */
router.get('/me', authenticateCustomer, customerAuthController.me);

/**
 * @swagger
 * /api/shop/forgot-password:
 *   post:
 *     summary: Request OTP for password reset
 *     tags: [CustomerAuth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: OTP sent
 */
router.post('/forgot-password', customerAuthController.forgotPassword);

/**
 * @swagger
 * /api/shop/reset-password:
 *   post:
 *     summary: Reset password with OTP
 *     tags: [CustomerAuth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               otp:
 *                 type: string
 *               new_password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password reset successful
 */
router.post('/reset-password', customerAuthController.resetPassword);

/**
 * @swagger
 * /api/shop/verify-otp:
 *   post:
 *     summary: Verify OTP (signup/login/reset)
 *     tags: [CustomerAuth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               otp:
 *                 type: string
 *               purpose:
 *                 type: string
 *     responses:
 *       200:
 *         description: OTP verified
 */
router.post('/verify-otp', customerAuthController.verifyOtp);

/**
 * @swagger
 * /api/shop/social-login:
 *   post:
 *     summary: Social login (Google/Facebook)
 *     tags: [CustomerAuth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               provider:
 *                 type: string
 *                 enum: [google, facebook]
 *               token:
 *                 type: string
 *     responses:
 *       200:
 *         description: Social login successful
 */
router.post('/social-login', customerAuthController.socialLogin);

module.exports = router;
