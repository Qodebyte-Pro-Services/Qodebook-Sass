const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middlewares/authMiddleware');
const serviceStaffAssignmentController = require('../controllers/serviceStaffAssignmentController');

/**
 * @swagger
 * /api/service-staff-assignments:
 *   post:
 *     summary: Assign staff to a service
 *     tags: [ServiceStaffAssignment]
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
 *               service_id:
 *                 type: integer
 *               staff_id:
 *                 type: string
 *     responses:
 *       201:
 *         description: Staff assigned to service
 */
router.post('/', authenticateToken, serviceStaffAssignmentController.assignStaff);

/**
 * @swagger
 * /api/service-staff-assignments:
 *   get:
 *     summary: List all service staff assignments
 *     tags: [ServiceStaffAssignment]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of service staff assignments
 */
router.get('/', authenticateToken, serviceStaffAssignmentController.listAssignments);

module.exports = router;
