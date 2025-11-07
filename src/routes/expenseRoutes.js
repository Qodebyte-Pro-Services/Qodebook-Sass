// expenseRoutes.js
const express = require('express');
const router = express.Router();
const controller = require('../controllers/expenseController');
const upload = require('../middlewares/upload');
const { requirePermission, requireAuthOnly } = require('../utils/routeHelpers');
const { FINANCIAL_PERMISSIONS } = require('../constants/permissions');

/**
 * @swagger
 * /api/expenses:
 *   post:
 *     summary: Create an expense (with optional receipt upload)
 *     tags: [Expense]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               business_id:
 *                 type: integer
 *                 example: 1
 *               category_id:
 *                 type: integer
 *                 example: 2
 *               staff_id:
 *                 type: string
 *                 example: "STF-12345"
 *               amount:
 *                 type: number
 *                 example: 1500.50
 *               description:
 *                 type: string
 *                 example: "Office supplies purchase"
 *               expense_date:
 *                 type: string
 *                 format: date
 *                 example: "2025-11-01"
 *               payment_method:
 *                 type: string
 *                 enum: [cash, credit_card, debit_card, bank_transfer, mobile_payment, other]
 *                 example: "bank_transfer"
 *               receipt:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Expense created successfully.
 *       400:
 *         description: Missing or invalid fields.
 *       500:
 *         description: Failed to create expense.
 */
router.post('/', ...requirePermission(FINANCIAL_PERMISSIONS.CREATE_EXPENSE), upload.single('receipt'), controller.create);

/**
 * @swagger
 * /api/expenses:
 *   get:
 *     summary: Get paginated list of expenses
 *     description: >
 *       Returns a paginated list of expenses, optionally filtered by `business_id` or `status`.  
 *       Joins related tables to return names instead of IDs.
 *     tags: [Expense]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: business_id
 *         schema:
 *           type: integer
 *         required: false
 *         description: Filter expenses by business ID
 *         example: 12
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, in_review, approved, rejected, cancelled]
 *         required: false
 *         description: Filter expenses by status
 *         example: approved
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of results per page
 *     responses:
 *       200:
 *         description: Paginated list of expenses
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 current_page:
 *                   type: integer
 *                   example: 1
 *                 total_pages:
 *                   type: integer
 *                   example: 3
 *                 total_records:
 *                   type: integer
 *                   example: 25
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 17
 *                       business_name:
 *                         type: string
 *                         example: "CryptoReclaims Ltd"
 *                       category_name:
 *                         type: string
 *                         example: "Office Supplies"
 *                       staff_name:
 *                         type: string
 *                         example: "Dominic Benson"
 *                       amount:
 *                         type: number
 *                         example: 25000.00
 *                       description:
 *                         type: string
 *                         example: "Monthly internet subscription"
 *                       expense_date:
 *                         type: string
 *                         format: date
 *                         example: "2025-10-31"
 *                       status:
 *                         type: string
 *                         example: "approved"
 *                       payment_method:
 *                         type: string
 *                         example: "bank_transfer"
 *                       payment_status:
 *                         type: string
 *                         example: "completed"
 *                       approved_at:
 *                         type: string
 *                         format: date-time
 *                         example: "2025-10-31T13:15:00Z"
 *                       approved_by_user_name:
 *                         type: string
 *                         example: "John Doe"
 *                       approved_by_staff_name:
 *                         type: string
 *                         example: "Jane Smith"
 *                       receipt_url:
 *                         type: string
 *                         example: "https://res.cloudinary.com/.../receipt.png"
 *       500:
 *         description: Server error listing expenses
 */
router.get('/', ...requirePermission(FINANCIAL_PERMISSIONS.VIEW_EXPENSES), controller.list);




/**
 * @swagger
 * /api/expenses/staff-salary:
 *   post:
 *     summary: Pay a staff salary and record it as an expense
 *     description: >
 *       Creates an expense entry for a staff salary payment.  
 *       Automatically marks the expense as **approved** and updates the staff's payment status to **paid**.  
 *       Only authorized users or staff with the correct financial permissions can perform this action.
 *     tags: [Expense]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - business_id
 *               - staff_id
 *               - amountToBePaid
 *             properties:
 *               business_id:
 *                 type: integer
 *                 description: The ID of the business the staff belongs to.
 *                 example: 101
 *               staff_id:
 *                 type: string
 *                 description: The unique identifier of the staff being paid.
 *                 example: "f94d2cce-0e4f-4f0d-8fd5-3e9c22a6d0fa"
 *               amountToBePaid:
 *                 type: number
 *                 description: The salary amount to pay.
 *                 example: 250000
 *               payment_method:
 *                 type: string
 *                 enum: [cash, credit_card, debit_card, bank_transfer, mobile_payment, other]
 *                 description: The method used for payment.
 *                 example: "bank_transfer"
 *               description:
 *                 type: string
 *                 description: Optional note about the salary payment.
 *                 example: "Monthly salary for October 2025"
 *               receipt:
 *                 type: string
 *                 format: binary
 *                 description: Optional payment receipt image upload.
 *     responses:
 *       201:
 *         description: Salary payment recorded successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Salary of ₦250,000 paid to John Doe"
 *                 expense:
 *                   type: object
 *                   description: Details of the recorded expense
 *       400:
 *         description: Invalid or missing input data.
 *       404:
 *         description: Staff not found for this business.
 *       500:
 *         description: Failed to process staff salary.
 */
router.post(
  '/staff-salary',
  ...requirePermission(FINANCIAL_PERMISSIONS.CREATE_STAFF_SALARY_EXPENSE),
  upload.single('receipt'),
  controller.payStaffSalary
);

/**
 * @swagger
 * /api/expenses/{id}:
 *   get:
 *     summary: Get detailed information for a specific expense
 *     description: >
 *       Retrieves a detailed expense record by its ID, including related business, category, and staff details.  
 *       This endpoint is suitable for generating invoices or detailed reports.
 *     tags: [Expense]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID of the expense
 *         schema:
 *           type: integer
 *           example: 42
 *     responses:
 *       200:
 *         description: Expense details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Expense details retrieved successfully."
 *                 expense:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 42
 *                     amount:
 *                       type: number
 *                       example: 75000.50
 *                     description:
 *                       type: string
 *                       example: "Monthly staff salary payment"
 *                     expense_date:
 *                       type: string
 *                       format: date
 *                       example: "2025-10-30"
 *                     status:
 *                       type: string
 *                       example: "approved"
 *                     payment_method:
 *                       type: string
 *                       example: "bank_transfer"
 *                     payment_status:
 *                       type: string
 *                       example: "completed"
 *                     approved_at:
 *                       type: string
 *                       format: date-time
 *                       example: "2025-10-30T12:00:00Z"
 *                     receipt_url:
 *                       type: string
 *                       example: "https://res.cloudinary.com/invoice-receipt.png"
 *                     business_name:
 *                       type: string
 *                       example: "CryptoReclaims Ltd"
 *                     business_email:
 *                       type: string
 *                       example: "support@cryptoreclaims.com"
 *                     business_phone:
 *                       type: string
 *                       example: "+2348012345678"
 *                     business_address:
 *                       type: string
 *                       example: "123 Ikeja Ave, Lagos, Nigeria"
 *                     category_name:
 *                       type: string
 *                       example: "Salary"
 *                     staff_name:
 *                       type: string
 *                       example: "Benson Dominic"
 *                     staff_role:
 *                       type: string
 *                       example: "Finance Manager"
 *                     approved_by_user_name:
 *                       type: string
 *                       example: "John Doe"
 *                     approved_by_staff_name:
 *                       type: string
 *                       example: "Jane Smith"
 *       404:
 *         description: Expense not found
 *       500:
 *         description: Server error fetching expense details
 */
router.get("/:id", controller.listExpense);

/**
 * @swagger
 * /api/expenses/staff-salary/{staff_id}:
 *   get:
 *     summary: Get salary payment history for a specific staff
 *     description: >
 *       Fetches all salary-related expenses for a particular staff, with pagination support.  
 *       Accessible by authorized admins or finance staff.
 *     tags: [Expense]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: staff_id
 *         required: true
 *         schema:
 *           type: string
 *         description: The staff unique ID.
 *         example: "f94d2cce-0e4f-4f0d-8fd5-3e9c22a6d0fa"
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: The page number for pagination.
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: The number of records per page.
 *     responses:
 *       200:
 *         description: Successfully retrieved staff salary history.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 staff_name:
 *                   type: string
 *                   example: "John Doe"
 *                 current_page:
 *                   type: integer
 *                   example: 1
 *                 total_pages:
 *                   type: integer
 *                   example: 3
 *                 total_records:
 *                   type: integer
 *                   example: 25
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 45
 *                       amount:
 *                         type: number
 *                         example: 250000
 *                       description:
 *                         type: string
 *                         example: "Monthly salary for October 2025"
 *                       payment_method:
 *                         type: string
 *                         example: "bank_transfer"
 *                       payment_date:
 *                         type: string
 *                         format: date-time
 *                         example: "2025-10-31T14:22:00.000Z"
 *                       approved_by_role:
 *                         type: string
 *                         example: "admin"
 *                       approved_at:
 *                         type: string
 *                         format: date-time
 *                         example: "2025-10-31T15:00:00.000Z"
 *                       receipt_url:
 *                         type: string
 *                         nullable: true
 *                         example: "https://example.com/uploads/receipts/salary_october_2025.png"
 *       400:
 *         description: Missing or invalid staff ID.
 *       404:
 *         description: Staff not found.
 *       500:
 *         description: Server error fetching staff salary history.
 */
router.get(
  "/staff-salary/:staff_id",
  ...requirePermission(FINANCIAL_PERMISSIONS.VIEW_FINANCIAL_REPORTS),
  controller.listSalaryForStaff
);


/**
 * @swagger
 * /api/expenses/expense-status/{id}:
 *   patch:
 *     summary: Approve, reject, or cancel an expense
 *     tags: [Expense]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Expense ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [in_review, approved, rejected, cancelled]
 *                 example: approved
 *     responses:
 *       200:
 *         description: Expense decision updated successfully.
 *       400:
 *         description: Invalid status or request body.
 *       404:
 *         description: Expense not found.
 *       500:
 *         description: Failed to update expense decision.
 */
router.patch('/expense-status/:id', ...requirePermission(FINANCIAL_PERMISSIONS.APPROVE_EXPENSE), controller.expenseDecison);

/**
 * @swagger
 * /api/expenses/payment_status/{id}:
 *   patch:
 *     summary: Update the payment status of an expense
 *     tags: [Expense]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Expense ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               payment_status:
 *                 type: string
 *                 enum: [pending, completed, failed]
 *                 example: completed
 *     responses:
 *       200:
 *         description: Expense payment status updated successfully.
 *       400:
 *         description: Invalid payment status or request body.
 *       404:
 *         description: Expense not found.
 *       500:
 *         description: Failed to update payment status.
 */
router.patch('payment_status/:id', ...requirePermission(FINANCIAL_PERMISSIONS.UPDATE_EXPENSE), controller.updatePayment);






/**
 * @swagger
 * /api/expenses/{id}:
 *   delete:
 *     summary: Delete an expense
 *     tags: [Expense]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Expense ID
 *     responses:
 *       200:
 *         description: Expense deleted
 */
router.delete('/:id', ...requirePermission(FINANCIAL_PERMISSIONS.DELETE_EXPENSE), controller.delete);



module.exports = router;
