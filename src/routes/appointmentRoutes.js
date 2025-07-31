const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middlewares/authMiddleware');
const appointmentController = require('../controllers/appointmentController');

/**
 * @swagger
 * /api/appointments:
 *   post:
 *     summary: Create an appointment
 *     tags: [Appointment]
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
 *               customer_id:
 *                 type: integer
 *               staff_id:
 *                 type: string
 *               appointment_time:
 *                 type: string
 *                 format: date-time
 *               status:
 *                 type: string
 *                 enum: [scheduled, completed, canceled, no_show]
 *               note:
 *                 type: string
 *     responses:
 *       201:
 *         description: Appointment created
 */
router.post('/', authenticateToken, appointmentController.createAppointment);

/**
 * @swagger
 * /api/appointments:
 *   get:
 *     summary: List all appointments
 *     tags: [Appointment]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of appointments
 */
router.get('/', authenticateToken, appointmentController.listAppointments);

module.exports = router;
