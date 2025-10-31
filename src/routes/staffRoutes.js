const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middlewares/authMiddleware');
const staffController = require('../controllers/staffController');
const { requirePermission, requireAuthOnly } = require('../utils/routeHelpers');
const { STAFF_PERMISSIONS, BUSINESS_PERMISSIONS } = require('../constants/permissions');
const upload = require('../middlewares/upload');

/**
 * @swagger
 * /api/staff/business_settings/{business_id}:
 *   post:
 *     summary: Create business staff settings
 *     description: |
 *       Creates new authentication, OTP, and session configuration settings for a given business branch.  
 *       Each business-branch pair can have one configuration entry.  
 *       Use the update endpoint if settings already exist.
 *     tags: [BusinessStaffSettings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: business_id
 *         in: path
 *         required: true
 *         description: ID of the business the settings belong to
 *         schema:
 *           type: integer
 *           example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - branch_id
 *             properties:
 *               branch_id:
 *                 type: integer
 *                 description: Branch ID associated with the business
 *                 example: 101
 *               password_delivery_method:
 *                 type: string
 *                 description: Method used to deliver passwords to staff (e.g., email, sms, manual)
 *                 example: "email"
 *               password_change_policy:
 *                 type: string
 *                 description: Rules for password changes (e.g., periodic, manual, enforced)
 *                 example: "periodic"
 *               require_otp_for_login:
 *                 type: boolean
 *                 description: Whether OTP is required during login
 *                 example: true
 *               otp_delivery_method:
 *                 type: string
 *                 description: OTP delivery method (e.g., sms, email, app)
 *                 example: "sms"
 *               session_timeout_minutes:
 *                 type: integer
 *                 description: Session timeout duration in minutes
 *                 example: 30
 *               max_login_attempts:
 *                 type: integer
 *                 description: Maximum allowed failed login attempts before lockout
 *                 example: 5
 *               lockout_duration_minutes:
 *                 type: integer
 *                 description: Duration (in minutes) for which account remains locked after too many failed logins
 *                 example: 15
 *     responses:
 *       201:
 *         description: Staff settings created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Staff settings created successfully.
 *                 settings:
 *                   $ref: '#/components/schemas/BusinessStaffSettings'
 *       400:
 *         description: Settings for this business and branch already exist
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/staff/business_settings/{business_id}:
 *   get:
 *     summary: Get business staff settings
 *     description: Retrieve authentication and security settings for a specific business and optionally by branch.
 *     tags: [BusinessStaffSettings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: business_id
 *         in: path
 *         required: true
 *         description: ID of the business to fetch settings for
 *         schema:
 *           type: integer
 *           example: 1
 *       - name: branch_id
 *         in: query
 *         required: false
 *         description: Optional branch ID to filter settings
 *         schema:
 *           type: integer
 *           example: 101
 *     responses:
 *       200:
 *         description: Staff settings retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 settings:
 *                   $ref: '#/components/schemas/BusinessStaffSettings'
 *       404:
 *         description: Settings not found
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/staff/business_settings/{business_id}:
 *   patch:
 *     summary: Update business staff settings
 *     description: |
 *       Updates or upserts staff authentication and session settings for a specific business and branch.
 *       If settings do not exist, they are created automatically.
 *     tags: [BusinessStaffSettings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: business_id
 *         in: path
 *         required: true
 *         description: ID of the business to update settings for
 *         schema:
 *           type: integer
 *           example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - branch_id
 *             properties:
 *               branch_id:
 *                 type: integer
 *                 example: 101
 *               password_delivery_method:
 *                 type: string
 *                 example: "email"
 *               password_change_policy:
 *                 type: string
 *                 example: "manual"
 *               require_otp_for_login:
 *                 type: boolean
 *                 example: true
 *               otp_delivery_method:
 *                 type: string
 *                 example: "sms"
 *               session_timeout_minutes:
 *                 type: integer
 *                 example: 45
 *               max_login_attempts:
 *                 type: integer
 *                 example: 3
 *               lockout_duration_minutes:
 *                 type: integer
 *                 example: 10
 *     responses:
 *       200:
 *         description: Staff settings updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Staff settings updated successfully.
 *                 settings:
 *                   $ref: '#/components/schemas/BusinessStaffSettings'
 *       500:
 *         description: Server error
 */
router.post('/business_settings/:business_id', ...requirePermission(BUSINESS_PERMISSIONS.MANAGE_BUSINESS_SETTINGS), staffController.createBusinessStaffSettings);
router.get('/business_settings/:business_id', ...requirePermission(BUSINESS_PERMISSIONS.MANAGE_BUSINESS_SETTINGS), staffController.getBusinessStaffSettings);
router.patch('/business_settings/:business_id', ...requirePermission(BUSINESS_PERMISSIONS.MANAGE_BUSINESS_SETTINGS), staffController.updateBusinessStaffSettings);

/**
 * @swagger
 * /api/staff/actions:
 *   post:
 *     summary: Log a staff action (e.g., clock-in, clock-out, custom actions)
 *     description: |
 *       Records an action performed by a staff member, such as clock-in, clock-out, or any custom action.
 *       Useful for attendance, task tracking, or custom workflows.
 *     tags: [StaffAction]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [id, business_id, staff_id, action_type]
 *             properties:
 *               id:
 *                 type: string
 *                 description: Unique action ID (UUID or generated)
 *                 example: "ACT123"
 *               business_id:
 *                 type: integer
 *                 description: Business ID
 *                 example: 1
 *               staff_id:
 *                 type: string
 *                 description: Staff ID
 *                 example: "STF001"
 *               action_type:
 *                 type: string
 *                 description: Type of action (e.g., clock_in, clock_out, break, custom)
 *                 example: "clock_in"
 *               action_value:
 *                 type: string
 *                 description: Optional value for the action (e.g., location, notes)
 *                 example: "Main Entrance"
 *               reason:
 *                 type: string
 *                 description: Optional reason for the action
 *                 example: "Late arrival"
 *               performed_by:
 *                 type: string
 *                 description: ID of the user/staff who recorded the action
 *                 example: "STF002"
 *               performed_by_role:
 *                 type: string
 *                 description: Role of the person who performed the action
 *                 example: "manager"
 *     responses:
 *       201:
 *         description: Staff action logged successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 staff_action:
 *                   $ref: '#/components/schemas/StaffAction'
 *       400:
 *         description: Missing required fields
 *       500:
 *         description: Server error
 */
router.post('/actions', ...requirePermission(STAFF_PERMISSIONS.MANAGE_STAFF_ACTIONS), staffController.createStaffAction);
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
router.get('/actions', ...requirePermission(STAFF_PERMISSIONS.VIEW_STAFF_ACTIONS), staffController.listStaffActions);
router.put('/actions/:id', ...requirePermission(STAFF_PERMISSIONS.MANAGE_STAFF_ACTIONS), staffController.updateStaffAction);
router.delete('/actions/:id', ...requirePermission(STAFF_PERMISSIONS.MANAGE_STAFF_ACTIONS), staffController.deleteStaffAction);
/**
 * @swagger
 * /api/staff/docs:
 *   post:
 *     summary: Attach a document to a staff profile
 *     description: |
 *       Uploads or links a document (e.g., contract, certificate) to a staff member's profile.
 *       Documents can be used for HR compliance, onboarding, or record-keeping.
 *     tags: [StaffDoc]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [id, business_id, staff_id, document_name, file]
 *             properties:
 *               id:
 *                 type: string
 *                 description: Unique document ID
 *                 example: "DOC123"
 *               business_id:
 *                 type: integer
 *                 description: Business ID
 *                 example: 1
 *               staff_id:
 *                 type: string
 *                 description: Staff ID
 *                 example: "STF001"
 *               document_name:
 *                 type: string
 *                 description: Name or type of the document
 *                 example: "Employment Contract"
 *               file:
 *                 type: string
 *                 description: File URL or base64-encoded content
 *                 example: "https://files.example.com/docs/contract.pdf"
 *     responses:
 *       201:
 *         description: Staff document attached successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 staff_doc:
 *                   $ref: '#/components/schemas/StaffDoc'
 *       400:
 *         description: Missing required fields
 *       500:
 *         description: Server error
 */
router.post('/docs', ...requirePermission(STAFF_PERMISSIONS.MANAGE_STAFF_DOCS), staffController.createStaffDoc);
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
router.get('/docs', ...requirePermission(STAFF_PERMISSIONS.VIEW_STAFF_DOCS), staffController.listStaffDocs);
router.put('/docs/:id', ...requirePermission(STAFF_PERMISSIONS.MANAGE_STAFF_DOCS), staffController.updateStaffDoc);
router.delete('/docs/:id', ...requirePermission(STAFF_PERMISSIONS.MANAGE_STAFF_DOCS), staffController.deleteStaffDoc);
/**
 * @swagger
 * /api/staff/shifts:
 *   post:
 *     summary: Create a staff work shift
 *     description: |
 *       Assigns a work shift to a staff member, including working hours and days.
 *       Useful for scheduling, attendance, and payroll.
 *     tags: [StaffShift]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [shift_id, staff_id, business_id, fullname]
 *             properties:
 *               shift_id:
 *                 type: string
 *                 description: Unique shift ID
 *                 example: "SHIFT001"
 *               staff_id:
 *                 type: string
 *                 description: Staff ID
 *                 example: "STF001"
 *               business_id:
 *                 type: integer
 *                 description: Business ID
 *                 example: 1
 *               fullname:
 *                 type: string
 *                 description: Staff full name
 *                 example: "John Doe"
 *               working_hours:
 *                 type: string
 *                 description: Working hours (e.g., 09:00-17:00)
 *                 example: "09:00-17:00"
 *               work_days:
 *                 type: string
 *                 description: Days of the week (e.g., Mon-Fri)
 *                 example: "Mon-Fri"
 *     responses:
 *       201:
 *         description: Staff shift created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 staff_shift:
 *                   $ref: '#/components/schemas/StaffShift'
 *       400:
 *         description: Missing required fields
 *       500:
 *         description: Server error
 */
router.post('/shifts', ...requirePermission(STAFF_PERMISSIONS.MANAGE_STAFF_SHIFTS), staffController.createStaffShift);
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
router.get('/shifts', ...requirePermission(STAFF_PERMISSIONS.VIEW_STAFF_SHIFTS), staffController.listStaffShifts);
router.put('/shifts/:id', ...requirePermission(STAFF_PERMISSIONS.MANAGE_STAFF_SHIFTS), staffController.updateStaffShift);
router.delete('/shifts/:id', ...requirePermission(STAFF_PERMISSIONS.MANAGE_STAFF_SHIFTS), staffController.deleteStaffShift);
/**
 * @swagger
 * /api/staff/subcharges:
 *   post:
 *     summary: Add a subcharge (deduction/bonus) to a staff member
 *     description: |
 *       Records a subcharge (e.g., penalty, bonus, deduction) for a staff member.
 *       Useful for payroll adjustments, fines, or incentives.
 *     tags: [StaffSubcharge]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [id, staff_id, sub_charge_amt]
 *             properties:
 *               id:
 *                 type: string
 *                 description: Unique subcharge ID
 *                 example: "SUBC123"
 *               staff_id:
 *                 type: string
 *                 description: Staff ID
 *                 example: "STF001"
 *               sub_charge_amt:
 *                 type: number
 *                 description: Amount of the subcharge (positive for bonus, negative for deduction)
 *                 example: -5000
 *               reason:
 *                 type: string
 *                 description: Reason for the subcharge
 *                 example: "Late coming penalty"
 *     responses:
 *       201:
 *         description: Staff subcharge recorded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 staff_subcharge:
 *                   $ref: '#/components/schemas/StaffSubcharge'
 *       400:
 *         description: Missing required fields
 *       500:
 *         description: Server error
 */
router.post('/subcharges', ...requirePermission(STAFF_PERMISSIONS.MANAGE_STAFF_SUBCHARGE), staffController.createStaffSubcharge);
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
router.get('/subcharges', ...requirePermission(STAFF_PERMISSIONS.VIEW_STAFF_SUBCHARGE), staffController.listStaffSubcharges);
router.put('/subcharges/:id', ...requirePermission(STAFF_PERMISSIONS.MANAGE_STAFF_SUBCHARGE), staffController.updateStaffSubcharge);
router.delete('/subcharges/:id', ...requirePermission(STAFF_PERMISSIONS.MANAGE_STAFF_SUBCHARGE), staffController.deleteStaffSubcharge);

/**
 * @swagger
 * /api/staff/roles:
 *   post:
 *     summary: Create a new staff role with permissions
 *     description: Creates a new role for a business. Role names must be unique within the business.
 *     tags: [StaffRole]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - business_id
 *               - role_name
 *               - permissions
 *               - created_by
 *             properties:
 *               business_id:
 *                 type: integer
 *                 example: 1
 *               role_name:
 *                 type: string
 *                 example: "Sales Manager"
 *               permissions:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["view_products", "create_sales"]
 *               created_by:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       201:
 *         description: Role created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 role:
 *                   $ref: '#/components/schemas/StaffRole'
 *       400:
 *         description: Missing required fields
 *       409:
 *         description: Role already exists for this business
 *       500:
 *         description: Server error
 */
router.post('/roles', ...requirePermission(STAFF_PERMISSIONS.MANAGE_ROLES), staffController.createRole);
/**
 * @swagger
 * /api/staff/roles:
 *   get:
 *     summary: List all staff roles for a business
 *     tags: [StaffRole]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: business_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the business
 *     responses:
 *       200:
 *         description: List of staff roles
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 roles:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/StaffRole'
 *       400:
 *         description: business_id is required
 *       500:
 *         description: Server error
 */
router.get('/roles', ...requirePermission(STAFF_PERMISSIONS.VIEW_ROLES), staffController.listRoles);
/**
 * @swagger
 * /api/staff/roles/{id}:
 *   get:
 *     summary: Get a staff role by ID
 *     tags: [StaffRole]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Role ID
 *       - in: query
 *         name: business_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Business ID
 *     responses:
 *       200:
 *         description: Role found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 role:
 *                   $ref: '#/components/schemas/StaffRole'
 *       400:
 *         description: business_id is required
 *       404:
 *         description: Role not found for this business
 *       500:
 *         description: Server error
 */
router.get('/roles/:id', ...requirePermission(STAFF_PERMISSIONS.VIEW_ROLES), staffController.getRoleById);

/**
 * @swagger
 * /api/staff/roles/{id}:
 *   put:
 *     summary: Update a staff role's name or permissions
 *     tags: [StaffRole]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Role ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               role_name:
 *                 type: string
 *               permissions:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Role updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 role:
 *                   $ref: '#/components/schemas/StaffRole'
 *       400:
 *         description: No fields to update
 *       404:
 *         description: Role not found
 *       500:
 *         description: Server error
 */
router.put('/roles/:id', ...requirePermission(STAFF_PERMISSIONS.MANAGE_ROLES), staffController.updateRole);
/**
 * @swagger
 * /api/staff/roles/{id}:
 *   delete:
 *     summary: Delete a staff role
 *     tags: [StaffRole]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Role ID
 *     responses:
 *       200:
 *         description: Role deleted successfully
 *       404:
 *         description: Role not found
 *       500:
 *         description: Server error
 */
router.delete('/roles/:id', ...requirePermission(STAFF_PERMISSIONS.MANAGE_ROLES), staffController.deleteRole);

/**
 * @swagger
 * /api/staff/create:
 *   post:
 *     summary: Create a new staff member with automatic password generation
 *     description: |
 *       Creates a new staff member and assigns them to a specific branch. The system automatically
 *       generates a password based on business settings and sends it to either the owner or staff member.
 *       
 *       **Business Logic:**
 *       - Generates unique staff ID
 *       - Creates password using business name + random numbers
 *       - Hashes password securely with bcrypt
 *       - Checks business staff settings for password delivery method
 *       - Sends password via email (to owner or staff based on settings)
 *       - Logs password creation for audit
 *       - Assigns staff to specified branch and role
 *       
 *       **Password Delivery Methods:**
 *       - `owner`: Password sent to business owner who shares with staff
 *       - `staff`: Password sent directly to staff member's email
 *       
 *       **Staff Status Options:**
 *       - `on_job`: Active staff member
 *       - `suspended`: Temporarily suspended
 *       - `terminated`: Permanently terminated
 *     tags: [Staff]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - business_id
 *               - branch_id
 *               - full_name
 *               - contact_no
 *               - email
 *               - role_id
 *             properties:
 *               business_id:
 *                 type: integer
 *                 description: ID of the business the staff will work for
 *                 example: 1
 *               branch_id:
 *                 type: integer
 *                 description: ID of the branch where staff will be assigned
 *                 example: 1
 *               full_name:
 *                 type: string
 *                 description: Full name of the staff member
 *                 example: "John Doe"
 *               contact_no:
 *                 type: string
 *                 description: Contact phone number
 *                 example: "+1234567890"
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email address (used for login and notifications)
 *                 example: "john.doe@business.com"
 *               role_id:
 *                 type: integer
 *                 description: ID of the role to assign (defines permissions)
 *                 example: 2
 *               gender:
 *                 type: string
 *                 enum: [male, female, other]
 *                 description: Gender identification
 *                 example: "male"
 *               staff_status:
 *                 type: string
 *                 enum: [on_job, suspended, terminated]
 *                 description: Current employment status
 *                 default: "on_job"
 *                 example: "on_job"
 *               payment_status:
 *                 type: string
 *                 enum: [paid, un_paid, paid_half]
 *                 description: Payment status for payroll purposes
 *                 default: "un_paid"
 *                 example: "un_paid"
 *               address:
 *                 type: string
 *                 description: Staff member's address
 *                 example: "123 Main St, City, State"
 *               emergency_contact:
 *                 type: string
 *                 description: Emergency contact information
 *                 example: "Jane Doe - +1987654321"
 *           examples:
 *             new_cashier:
 *               summary: Create a new cashier
 *               value:
 *                 business_id: 1
 *                 branch_id: 1
 *                 full_name: "John Doe"
 *                 contact_no: "+1234567890"
 *                 email: "john.doe@business.com"
 *                 role_id: 2
 *                 gender: "male"
 *                 address: "123 Main St, City, State"
 *             new_manager:
 *               summary: Create a new manager
 *               value:
 *                 business_id: 1
 *                 branch_id: 1
 *                 full_name: "Jane Smith"
 *                 contact_no: "+1987654321"
 *                 email: "jane.smith@business.com"
 *                 role_id: 3
 *                 gender: "female"
 *                 staff_status: "on_job"
 *     responses:
 *       201:
 *         description: Staff created successfully with password generated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Staff created successfully. Password sent to owner."
 *                 staff:
 *                   type: object
 *                   properties:
 *                     staff_id:
 *                       type: string
 *                       example: "STF001"
 *                     full_name:
 *                       type: string
 *                       example: "John Doe"
 *                     email:
 *                       type: string
 *                       example: "john.doe@business.com"
 *                     business_id:
 *                       type: integer
 *                       example: 1
 *                     branch_id:
 *                       type: integer
 *                       example: 1
 *                     role_id:
 *                       type: integer
 *                       example: 2
 *                     staff_status:
 *                       type: string
 *                       example: "on_job"
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *                       example: "2024-01-15T10:30:00Z"
 *                 password:
 *                   type: string
 *                   description: Generated password (only returned if delivery method is 'owner')
 *                   example: "MyBusiness123"
 *       400:
 *         description: Invalid request data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Required fields missing"
 *       409:
 *         description: Staff email already exists
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Staff with this email already exists"
 *       404:
 *         description: Business, branch, or role not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Business not found"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Server error"
 */
router.post(
  '/create',
  upload.fields([
    { name: 'photo', maxCount: 1 },
    { name: 'documents', maxCount: 10 }
  ]),
  ...requirePermission(STAFF_PERMISSIONS.CREATE_STAFF),
  staffController.createStaff
);
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
router.get('/', ...requirePermission(STAFF_PERMISSIONS.VIEW_STAFF), staffController.listStaff);

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
router.get('/:id', ...requirePermission(STAFF_PERMISSIONS.VIEW_STAFF), staffController.getStaff);

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
router.put('/:id', ...requirePermission(STAFF_PERMISSIONS.UPDATE_STAFF), staffController.updateStaff);

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
router.delete('/:id', ...requirePermission(STAFF_PERMISSIONS.DELETE_STAFF), staffController.deleteStaff);

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
router.get('/business/:id', ...requirePermission(STAFF_PERMISSIONS.VIEW_STAFF), staffController.getStaffByBusiness);

// Staff Authentication Routes

/**
 * @swagger
 * /api/staff/login:
 *   post:
 *     summary: Staff login with business-specific authentication
 *     description: |
 *       Allows staff members to log into the system using their email, password, and business ID.
 *       Depending on business settings, login may require OTP verification before issuing a token.
 *       
 *       **Business Logic:**
 *       - Validates staff exists for the specified business
 *       - Checks if staff account is active
 *       - Verifies password with bcrypt
 *       - Checks if OTP is required for login
 *       - If OTP required → generates OTP, sends to staff or business owner
 *       - If not → generates JWT and logs login
 *     tags: [StaffAuth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - business_id
 *             properties:
 *               email:
 *                 type: string
 *                 example: "john.doe@business.com"
 *               password:
 *                 type: string
 *                 example: "MyBusiness123"
 *               business_id:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       200:
 *         description: Login successful or OTP required
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: "Login successful"
 *                     requiresOtp:
 *                       type: boolean
 *                       example: false
 *                     token:
 *                       type: string
 *                       example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                     staff:
 *                       type: object
 *                       properties:
 *                         staff_id:
 *                           type: string
 *                           example: "STF001"
 *                         full_name:
 *                           type: string
 *                           example: "John Doe"
 *                         email:
 *                           type: string
 *                           example: "john.doe@business.com"
 *                         role:
 *                           type: string
 *                           example: "Sales Manager"
 *                         permissions:
 *                           type: array
 *                           items:
 *                             type: string
 *                           example: ["view_dashboard", "manage_sales"]
 *                         business_id:
 *                           type: integer
 *                           example: 1
 *                         branch_id:
 *                           type: integer
 *                           example: 2
 *                 - type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: "OTP sent via staff. Please verify to complete login."
 *                     requiresOtp:
 *                       type: boolean
 *                       example: true
 *                     staff_id:
 *                       type: string
 *                       example: "STF001"
 *                     business_id:
 *                       type: integer
 *                       example: 1
 *       401:
 *         description: Invalid credentials or inactive staff
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Invalid credentials or inactive staff."
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Server error."
 */
router.post('/login', staffController.staffLogin);


/**
 * @swagger
 * /api/staff/verify-otp:
 *   post:
 *     summary: Verify staff OTP for login completion
 *     description: |
 *       This endpoint verifies a one-time password (OTP) that was sent to a staff member during login.
 *       Upon successful verification, it marks the OTP as used, generates a JWT session token, and returns
 *       the authenticated staff’s profile and permissions.
 *       
 *       **Business Logic:**
 *       - Validates that OTP, staff_id, business_id, and purpose are provided
 *       - Checks if OTP is valid, unexpired, and unused
 *       - Marks OTP as used after successful verification
 *       - Retrieves staff details and permissions
 *       - Generates JWT with staff’s business and role context
 *     tags: [StaffAuth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - staff_id
 *               - business_id
 *               - otp
 *               - purpose
 *             properties:
 *               staff_id:
 *                 type: string
 *                 description: Unique staff identifier
 *                 example: "STF001"
 *               business_id:
 *                 type: integer
 *                 description: Business the staff belongs to
 *                 example: 1
 *               otp:
 *                 type: string
 *                 description: 6-digit OTP sent during login
 *                 example: "345678"
 *               purpose:
 *                 type: string
 *                 description: Purpose of the OTP (e.g. login, password_reset)
 *                 example: "login"
 *     responses:
 *       200:
 *         description: OTP verified successfully, returns JWT and staff details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "OTP verified. Login successful."
 *                 token:
 *                   type: string
 *                   description: JWT token for authenticated requests
 *                   example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                 staff:
 *                   type: object
 *                   properties:
 *                     staff_id:
 *                       type: string
 *                       example: "STF001"
 *                     full_name:
 *                       type: string
 *                       example: "John Doe"
 *                     email:
 *                       type: string
 *                       example: "john.doe@business.com"
 *                     business_id:
 *                       type: integer
 *                       example: 1
 *                     branch_id:
 *                       type: integer
 *                       example: 2
 *                     role:
 *                       type: string
 *                       example: "Sales Manager"
 *                     permissions:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["view_dashboard", "manage_sales"]
 *       400:
 *         description: Invalid or expired OTP
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Invalid or expired OTP."
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Server error."
 */
router.post('/verify-otp', staffController.verifyStaffOtp);



/**
 * @swagger
 * /api/staff/resend-otp:
 *   post:
 *     summary: Resend OTP to staff for login verification
 *     description: |
 *       Resends a new one-time password (OTP) for a staff member who has not yet verified their login.
 *       Invalidates any previous unused OTPs for the same purpose and generates a fresh OTP
 *       according to the business’s OTP delivery settings (either to the staff’s email or the business owner’s email).
 *       
 *       **Business Logic:**
 *       - Validates that staff exists and is active under the given business
 *       - Checks if OTP login is enabled in the business settings
 *       - Invalidates existing OTPs for that staff and purpose
 *       - Generates a new OTP with a 10-minute expiry
 *       - Sends OTP via the configured delivery method
 *     tags: [StaffAuth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - staff_id
 *               - business_id
 *             properties:
 *               staff_id:
 *                 type: string
 *                 description: Unique staff identifier
 *                 example: "STF001"
 *               business_id:
 *                 type: integer
 *                 description: Business the staff belongs to
 *                 example: 1
 *               purpose:
 *                 type: string
 *                 description: Purpose of the OTP (default is "login")
 *                 example: "login"
 *     responses:
 *       200:
 *         description: OTP resent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "A new OTP has been sent via staff."
 *                 success:
 *                   type: boolean
 *                   example: true
 *       400:
 *         description: Missing fields or OTP not required for this business
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "OTP login is not required for this business."
 *       404:
 *         description: Staff not found or inactive
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Staff not found or inactive."
 *       500:
 *         description: Server error while resending OTP
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Server error while resending OTP."
 */
router.post('/resend-otp', staffController.resendStaffOtp);


/**
 * @swagger
 * /api/staff/password/change:
 *   post:
 *     summary: Request or perform password change based on business policy
 *     description: |
 *       Allows staff to change their password according to the business's password change policy.
 *       The behavior depends on the business settings:
 *       
 *       **Policy: 'request'** - Staff requests password change, owner must approve
 *       **Policy: 'self'** - Staff can change password directly
 *       
 *       **Business Logic:**
 *       - Validates current password
 *       - Checks business password change policy
 *       - If 'request' policy: Creates pending request, notifies owner
 *       - If 'self' policy: Updates password immediately, notifies staff
 *       - Logs password change attempt for audit
 *       - Sends email notifications based on policy
 *     tags: [StaffAuth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - staff_id
 *               - new_password
 *               - current_password
 *             properties:
 *               staff_id:
 *                 type: string
 *                 description: Staff ID requesting password change
 *                 example: "STF001"
 *               new_password:
 *                 type: string
 *                 description: New password (minimum 8 characters recommended)
 *                 example: "NewSecurePass123"
 *               current_password:
 *                 type: string
 *                 description: Current password for verification
 *                 example: "OldPassword123"
 *           examples:
 *             request_change:
 *               summary: Request password change
 *               value:
 *                 staff_id: "STF001"
 *                 new_password: "NewSecurePass123"
 *                 current_password: "OldPassword123"
 *     responses:
 *       200:
 *         description: Password change processed according to policy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Password change request submitted. Awaiting owner approval."
 *                 request_id:
 *                   type: integer
 *                   description: ID of the password change request (if policy is 'request')
 *                   example: 123
 *                 policy:
 *                   type: string
 *                   description: The policy that was applied
 *                   example: "request"
 *       400:
 *         description: Invalid request or current password incorrect
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Current password is incorrect"
 *       404:
 *         description: Staff not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Staff not found"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Server error"
 */
router.post('/password/change', ...requirePermission(STAFF_PERMISSIONS.CHANGE_PASSWORD), staffController.requestPasswordChange);



router.post('/settings/:business_id', ...requirePermission(BUSINESS_PERMISSIONS.MANAGE_SETTINGS), staffController.updateBusinessStaffSettings);
/**
 * @swagger
 * /api/staff/settings/{business_id}:
 *   get:
 *     summary: Retrieve business staff authentication and security settings
 *     description: |
 *       Gets the current staff authentication and security settings for a business.
 *       These settings control how staff passwords are delivered, password change policies,
 *       login security measures, and session management.
 *       
 *       **Settings Include:**
 *       - Password delivery method (owner vs staff)
 *       - Password change policy (request approval vs self-service)
 *       - OTP requirements for login
 *       - Session timeout settings
 *       - Login attempt limits and lockout policies
 *       
 *       **Access Control:** Only business owners can view these settings
 *     tags: [StaffSettings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: business_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the business to get settings for
 *         example: 1
 *       - in: query
 *         name: branch_id
 *         schema:
 *           type: integer
 *         description: Optional branch ID for branch-specific settings
 *         example: 1
 *     responses:
 *       200:
 *         description: Business staff settings retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Settings retrieved successfully"
 *                 settings:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     business_id:
 *                       type: integer
 *                       example: 1
 *                     branch_id:
 *                       type: integer
 *                       example: 1
 *                     password_delivery_method:
 *                       type: string
 *                       enum: [owner, staff]
 *                       description: How staff passwords are delivered during creation
 *                       example: "owner"
 *                     password_change_policy:
 *                       type: string
 *                       enum: [request, self]
 *                       description: Whether staff can change passwords directly or need approval
 *                       example: "request"
 *                     require_otp_for_login:
 *                       type: boolean
 *                       description: Whether OTP is required for staff login
 *                       example: false
 *                     otp_delivery_method:
 *                       type: string
 *                       enum: [owner, staff]
 *                       description: How OTP is delivered when required
 *                       example: "owner"
 *                     session_timeout_minutes:
 *                       type: integer
 *                       description: Session timeout in minutes
 *                       example: 480
 *                     max_login_attempts:
 *                       type: integer
 *                       description: Maximum failed login attempts before lockout
 *                       example: 5
 *                     lockout_duration_minutes:
 *                       type: integer
 *                       description: Lockout duration in minutes after max attempts
 *                       example: 30
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *                       example: "2024-01-15T10:30:00Z"
 *                     updated_at:
 *                       type: string
 *                       format: date-time
 *                       example: "2024-01-15T10:30:00Z"
 *       403:
 *         description: Unauthorized - only business owners can view settings
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Only business owners can view staff settings"
 *       404:
 *         description: Business or settings not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Business not found"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Server error"
 */
router.get('/settings/:business_id', ...requirePermission(BUSINESS_PERMISSIONS.VIEW_SETTINGS), staffController.getBusinessStaffSettings);

/**
 * @swagger
 * /api/staff/settings/{business_id}:
 *   put:
 *     summary: Update business staff settings
 *     tags: [StaffSettings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: business_id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               branch_id:
 *                 type: integer
 *               password_delivery_method:
 *                 type: string
 *                 enum: [owner, staff]
 *               password_change_policy:
 *                 type: string
 *                 enum: [request, self]
 *               require_otp_for_login:
 *                 type: boolean
 *               otp_delivery_method:
 *                 type: string
 *                 enum: [owner, staff]
 *               session_timeout_minutes:
 *                 type: integer
 *               max_login_attempts:
 *                 type: integer
 *               lockout_duration_minutes:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Settings updated successfully
 */
router.put('/settings/:business_id', ...requirePermission(BUSINESS_PERMISSIONS.MANAGE_BUSINESS_SETTINGS), staffController.updateBusinessStaffSettings);

// Staff Login History Routes
/**
 * @swagger
 * /api/staff/logins/{business_id}:
 *   get:
 *     summary: Retrieve comprehensive staff login audit trail
 *     description: |
 *       Gets a detailed audit trail of all staff login attempts for a business.
 *       This includes successful logins, failed attempts, IP addresses, user agents,
 *       and timestamps for security monitoring and compliance.
 *       
 *       **Audit Information Includes:**
 *       - Login success/failure status
 *       - Staff member details
 *       - IP address and user agent
 *       - Timestamp of login attempt
 *       - Branch location (if applicable)
 *       
 *       **Filtering Options:**
 *       - Filter by specific staff member
 *       - Filter by date range
 *       - Pagination support
 *       
 *       **Access Control:** Only business owners can view login history
 *     tags: [StaffLogs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: business_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the business to get login history for
 *         example: 1
 *       - in: query
 *         name: staff_id
 *         schema:
 *           type: string
 *         description: Filter by specific staff member ID
 *         example: "STF001"
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for filtering (YYYY-MM-DD)
 *         example: "2024-01-01"
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for filtering (YYYY-MM-DD)
 *         example: "2024-01-31"
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [success, failed]
 *         description: Filter by login status
 *         example: "success"
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Number of records to return (max 100)
 *         example: 25
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of records to skip for pagination
 *         example: 0
 *     responses:
 *       200:
 *         description: Staff login history retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Login history retrieved successfully"
 *                 logins:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 1
 *                       staff_id:
 *                         type: string
 *                         example: "STF001"
 *                       staff_name:
 *                         type: string
 *                         example: "John Doe"
 *                       business_id:
 *                         type: integer
 *                         example: 1
 *                       branch_id:
 *                         type: integer
 *                         example: 1
 *                       branch_name:
 *                         type: string
 *                         example: "Main Branch"
 *                       login_status:
 *                         type: string
 *                         enum: [success, failed]
 *                         example: "success"
 *                       ip_address:
 *                         type: string
 *                         example: "192.168.1.100"
 *                       user_agent:
 *                         type: string
 *                         example: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
 *                       login_attempt_time:
 *                         type: string
 *                         format: date-time
 *                         example: "2024-01-15T10:30:00Z"
 *                       failure_reason:
 *                         type: string
 *                         description: Reason for failed login (if applicable)
 *                         example: "Invalid password"
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total_records:
 *                       type: integer
 *                       example: 150
 *                     total_pages:
 *                       type: integer
 *                       example: 6
 *                     current_page:
 *                       type: integer
 *                       example: 1
 *                     limit:
 *                       type: integer
 *                       example: 25
 *                     offset:
 *                       type: integer
 *                       example: 0
 *                 summary:
 *                   type: object
 *                   properties:
 *                     total_logins:
 *                       type: integer
 *                       example: 150
 *                     successful_logins:
 *                       type: integer
 *                       example: 145
 *                     failed_logins:
 *                       type: integer
 *                       example: 5
 *                     unique_staff:
 *                       type: integer
 *                       example: 8
 *       403:
 *         description: Unauthorized - only business owners can view login history
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Only business owners can view login history"
 *       404:
 *         description: Business not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Business not found"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Server error"
 */
router.get('/logins/:business_id', ...requirePermission(STAFF_PERMISSIONS.VIEW_STAFF_LOGINS), staffController.getStaffLoginHistory);

// Password Change Request Management Routes
/**
 * @swagger
 * /api/staff/password/approve/{request_id}:
 *   post:
 *     summary: Approve password change request
 *     tags: [StaffAuth]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: request_id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - staff_id
 *               - new_password
 *             properties:
 *               staff_id:
 *                 type: string
 *               new_password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password change request approved
 */
router.post('/password/approve/:request_id', ...requirePermission(STAFF_PERMISSIONS.APPROVE_PASSWORD_CHANGE), staffController.approvePasswordChangeRequest);

/**
 * @swagger
 * /api/staff/password/reject/{request_id}:
 *   post:
 *     summary: Reject password change request
 *     tags: [StaffAuth]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: request_id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               rejection_reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password change request rejected
 */
router.post('/password/reject/:request_id', ...requirePermission(STAFF_PERMISSIONS.REJECT_PASSWORD_CHANGE), staffController.rejectPasswordChangeRequest);


module.exports = router;
