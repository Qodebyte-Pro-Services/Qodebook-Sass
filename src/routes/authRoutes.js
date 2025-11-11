const passport = require('passport');
const { configureFacebookStrategy } = require('../services/facebookAuthService');
const facebookAuthController = require('../controllers/facebookAuthController');
const express = require('express');
const router = express.Router();
const { validateSignup, validateLogin } = require('../middlewares/validateInput');
const authController = require('../controllers/authController');
const {requireAuthOnly} = require('../utils/routeHelpers');
const auditLog = require('../middlewares/auditLogMiddleware');
const { rateLimitMiddleware } = require('../middlewares/rateLimitMiddleware');


// configureFacebookStrategy();

/**
 * @swagger
 * /api/auth/social-login/google:
 *   post:
 *     summary: Google social login
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               idToken:
 *                 type: string
 *                 description: Google OAuth2 token
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 */
router.post('/social-login/google', rateLimitMiddleware, authController.googleLogin);


// /**
//  * @swagger
//  * /api/auth/social-login/facebook:
//  *   get:
//  *     summary: Facebook social login (redirect)
//  *     tags: [Auth]
//  *     responses:
//  *       302:
//  *         description: Redirect to Facebook for authentication
//  */
// router.get('/social-login/facebook', passport.authenticate('facebook', { scope: ['email'] }));

// /**
//  * @swagger
//  * /api/auth/social-login/facebook/callback:
//  *   get:
//  *     summary: Facebook social login callback
//  *     tags: [Auth]
//  *     responses:
//  *       200:
//  *         description: Facebook login successful
//  *       401:
//  *         description: Facebook authentication failed
//  */
// router.get('/social-login/facebook/callback', passport.authenticate('facebook', { session: false, failureRedirect: '/login' }), facebookAuthController.facebookCallback);


/**
 * @swagger
 * /api/auth/signup:
 *   post:
 *     summary: User signup
 *     tags: [Auth]
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
 *               first_name:
 *                 type: string
 *               last_name:
 *                 type: string
 *               phone:           
 *                 type: string
 *               is_social_media:
 *                  type: boolean
 *     responses:
 *       201:
 *         description: Signup successful
 *       409:
 *         description: Email already exists
 */
router.post('/signup', rateLimitMiddleware, validateSignup, authController.signup);

/**
 * @swagger
 * /api/auth/resend-otp:
 *   post:
 *     summary: Resend OTP for signup, login, or reset
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               purpose:
 *                 type: string
 *                 enum: [register, login, reset]
 *     responses:
 *       200:
 *         description: OTP resent
 *       404:
 *         description: User not found
 */
router.post('/resend-otp', rateLimitMiddleware, require('../controllers/authController').resendOtp);


/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: User login
 *     tags: [Auth]
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
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', rateLimitMiddleware, validateLogin, authController.login);


/**
 * @swagger
 * /api/auth/verify-otp:
 *   post:
 *     summary: Verify OTP for signup or login
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               user_id:
 *                 type: string
 *               otp:
 *                 type: string
 *               purpose:
 *                 type: string
 *                 enum: [register, login]
 *     responses:
 *       200:
 *         description: OTP verified
 *       400:
 *         description: Invalid or expired OTP
 *       404:
 *         description: User not found
 */
router.post('/verify-otp', auditLog('OTP_VERIFY', 'User submitted OTP'), authController.verifyOtp);


/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: Request password reset
 *     tags: [Auth]
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
 *         description: Password reset email sent
 */
router.post('/forgot-password', rateLimitMiddleware, auditLog('OTP_REQUEST', 'Forgot password initiated'), authController.forgotPassword);


/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: Reset password (requires token from OTP verification)
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []  # <- Indicates Authorization: Bearer token is required
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               newPassword:
 *                 type: string
 *                 example: StrongPass123!
 *     responses:
 *       200:
 *         description: Password reset successful
 *       400:
 *         description: Missing new password
 *       401:
 *         description: Invalid or expired token
 */

router.post('/reset-password', auditLog('RESET_PASSWORD', 'Password reset after OTP'), authController.resetPassword);


/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout user
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Logout successful
 */
router.post('/logout', authController.logout);


/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get user profile
 *     description: Requires a valid JWT token. `user_id` is extracted from the token.
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     first_name:
 *                       type: string
 *                     last_name:
 *                       type: string
 *                     email:
 *                       type: string
 *                     phone:
 *                       type: string
 *                     is_verified:
 *                       type: boolean
 *                     is_social_media:
 *                       type: boolean
 *                     created_at:
 *                       type: string
 *                     updated_at:
 *                       type: string
 *       401:
 *         description: Unauthorized - missing or invalid token
 */
router.get('/me', ...requireAuthOnly(), authController.getProfile);

/**
 * @swagger
 * /api/auth/me:
 *   put:
 *     summary: Update user profile
 *     description: Requires a valid JWT token. `user_id` is extracted from the token.
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               first_name:
 *                 type: string
 *               last_name:
 *                 type: string
 *               phone:
 *                 type: string
 *               profile_image:
 *                 type: string
 *                 description: URL or base64 string of the profile image. If a URL is provided, it will be uploaded to Cloudinary.
 *     responses:
 *       200:
 *         description: Profile updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     first_name:
 *                       type: string
 *                     last_name:
 *                       type: string
 *                     email:
 *                       type: string
 *                     phone:
 *                       type: string
 *                     profile_image:
 *                       type: string
 *                       description: Cloudinary URL of the profile image
 *                     is_verified:
 *                       type: boolean
 *                     is_social_media:
 *                       type: boolean
 *                     created_at:
 *                       type: string
 *                     updated_at:
 *                       type: string
 *       401:
 *         description: Unauthorized - missing or invalid token
 */
router.put('/me',  ...requireAuthOnly(), authController.updateProfile);

module.exports = router;
