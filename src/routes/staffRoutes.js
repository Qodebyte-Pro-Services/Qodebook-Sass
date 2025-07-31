const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middlewares/authMiddleware');
const staffController = require('../controllers/staffController');
/**
 * @swagger
 * /api/staff/actions:
 *   post:
 *     summary: Create staff action
 *     tags: [StaffAction]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Staff action created
 */
router.post('/actions', authenticateToken, staffController.createStaffAction);
/**
 * @swagger
 * /api/staff/actions:
 *   get:
 *     summary: List staff actions
 *     tags: [StaffAction]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of staff actions
 */
/**
 * @swagger
 * /api/staff/actions/{id}:
 *   put:
 *     summary: Update staff action
 *     tags: [StaffAction]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Staff action ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Staff action updated
 */
/**
 * @swagger
 * /api/staff/actions/{id}:
 *   delete:
 *     summary: Delete staff action
 *     tags: [StaffAction]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Staff action ID
 *     responses:
 *       200:
 *         description: Staff action deleted
 */
router.get('/actions', authenticateToken, staffController.listStaffActions);
router.put('/actions/:id', authenticateToken, staffController.updateStaffAction);
router.delete('/actions/:id', authenticateToken, staffController.deleteStaffAction);
/**
 * @swagger
 * /api/staff/docs:
 *   post:
 *     summary: Create staff doc
 *     tags: [StaffDoc]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Staff doc created
 */
router.post('/docs', authenticateToken, staffController.createStaffDoc);
/**
 * @swagger
 * /api/staff/docs:
 *   get:
 *     summary: List staff docs
 *     tags: [StaffDoc]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of staff docs
 */
/**
 * @swagger
 * /api/staff/docs/{id}:
 *   put:
 *     summary: Update staff doc
 *     tags: [StaffDoc]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Staff doc ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Staff doc updated
 */
/**
 * @swagger
 * /api/staff/docs/{id}:
 *   delete:
 *     summary: Delete staff doc
 *     tags: [StaffDoc]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Staff doc ID
 *     responses:
 *       200:
 *         description: Staff doc deleted
 */
router.get('/docs', authenticateToken, staffController.listStaffDocs);
router.put('/docs/:id', authenticateToken, staffController.updateStaffDoc);
router.delete('/docs/:id', authenticateToken, staffController.deleteStaffDoc);
/**
 * @swagger
 * /api/staff/shifts:
 *   post:
 *     summary: Create staff shift
 *     tags: [StaffShift]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Staff shift created
 */
router.post('/shifts', authenticateToken, staffController.createStaffShift);
/**
 * @swagger
 * /api/staff/shifts:
 *   get:
 *     summary: List staff shifts
 *     tags: [StaffShift]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of staff shifts
 */
/**
 * @swagger
 * /api/staff/shifts/{id}:
 *   put:
 *     summary: Update staff shift
 *     tags: [StaffShift]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Staff shift ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Staff shift updated
 */
/**
 * @swagger
 * /api/staff/shifts/{id}:
 *   delete:
 *     summary: Delete staff shift
 *     tags: [StaffShift]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Staff shift ID
 *     responses:
 *       200:
 *         description: Staff shift deleted
 */
router.get('/shifts', authenticateToken, staffController.listStaffShifts);
router.put('/shifts/:id', authenticateToken, staffController.updateStaffShift);
router.delete('/shifts/:id', authenticateToken, staffController.deleteStaffShift);
/**
 * @swagger
 * /api/staff/subcharges:
 *   post:
 *     summary: Create staff subcharge
 *     tags: [StaffSubcharge]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Staff subcharge created
 */
router.post('/subcharges', authenticateToken, staffController.createStaffSubcharge);
/**
 * @swagger
 * /api/staff/subcharges:
 *   get:
 *     summary: List staff subcharges
 *     tags: [StaffSubcharge]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of staff subcharges
 */
/**
 * @swagger
 * /api/staff/subcharges/{id}:
 *   put:
 *     summary: Update staff subcharge
 *     tags: [StaffSubcharge]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Staff subcharge ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Staff subcharge updated
 */
/**
 * @swagger
 * /api/staff/subcharges/{id}:
 *   delete:
 *     summary: Delete staff subcharge
 *     tags: [StaffSubcharge]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Staff subcharge ID
 *     responses:
 *       200:
 *         description: Staff subcharge deleted
 */
router.get('/subcharges', authenticateToken, staffController.listStaffSubcharges);
router.put('/subcharges/:id', authenticateToken, staffController.updateStaffSubcharge);
router.delete('/subcharges/:id', authenticateToken, staffController.deleteStaffSubcharge);
/**
 * @swagger
 * /api/staff/roles:
 *   post:
 *     summary: Create staff role
 *     tags: [StaffRole]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Staff role created
 */
router.post('/roles', authenticateToken, staffController.createRole);
/**
 * @swagger
 * /api/staff/roles:
 *   get:
 *     summary: List staff roles
 *     tags: [StaffRole]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of staff roles
 */
router.get('/roles', authenticateToken, staffController.listRoles);
/**
 * @swagger
 * /api/staff/roles/{id}:
 *   put:
 *     summary: Update staff role
 *     tags: [StaffRole]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Staff role ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Staff role updated
 */
router.put('/roles/:id', authenticateToken, staffController.updateRole);
/**
 * @swagger
 * /api/staff/roles/{id}:
 *   delete:
 *     summary: Delete staff role
 *     tags: [StaffRole]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Staff role ID
 *     responses:
 *       200:
 *         description: Staff role deleted
 */
router.delete('/roles/:id', authenticateToken, staffController.deleteRole);

/**
 * @swagger
 * /api/staff/create:
 *   post:
 *     summary: Add staff to branch
 *     tags: [Staff]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               staff_id:
 *                 type: string
 *               business_id:
 *                 type: integer
 *               branch_id:
 *                 type: integer
 *               full_name:
 *                 type: string
 *               contact_no:
 *                 type: string
 *               email:
 *                 type: string
 *               gender:
 *                 type: string
 *                 enum: [male, female, other]
 *               staff_status:
 *                 type: string
 *                 enum: [on_job, suspended, terminated]
 *               payment_status:
 *                 type: string
 *                 enum: [paid, un_paid, paid_half]
 *     responses:
 *       201:
 *         description: Staff created
 */
router.post('/create', authenticateToken, staffController.createStaff);

/**
 * @swagger
 * /api/staff:
 *   get:
 *     summary: List staff
 *     tags: [Staff]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of staff
 */
router.get('/', authenticateToken, staffController.listStaff);

/**
 * @swagger
 * /api/staff/{id}:
 *   get:
 *     summary: Get staff details
 *     tags: [Staff]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Staff ID
 *     responses:
 *       200:
 *         description: Staff details
 */
router.get('/:id', authenticateToken, staffController.getStaff);

/**
 * @swagger
 * /api/staff/{id}:
 *   put:
 *     summary: Update staff info
 *     tags: [Staff]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Staff ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Staff updated
 */
router.put('/:id', authenticateToken, staffController.updateStaff);

/**
 * @swagger
 * /api/staff/{id}:
 *   delete:
 *     summary: Remove staff
 *     tags: [Staff]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Staff ID
 *     responses:
 *       200:
 *         description: Staff deleted
 */
router.delete('/:id', authenticateToken, staffController.deleteStaff);

/**
 * @swagger
 * /api/staff/business/{id}:
 *   get:
 *     summary: Get staff for a business
 *     tags: [Staff]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Business ID
 *     responses:
 *       200:
 *         description: List of staff for business
 */
router.get('/business/:id', authenticateToken, staffController.getStaffByBusiness);





module.exports = router;
