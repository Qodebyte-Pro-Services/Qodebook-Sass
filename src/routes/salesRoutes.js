const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middlewares/authMiddleware');
const salesController = require('../controllers/salesController');
const { requirePermission, requireAuthOnly } = require('../utils/routeHelpers');
const { SALES_PERMISSIONS } = require('../constants/permissions');
const { rateLimitMiddleware } = require('../middlewares/rateLimitMiddleware');
/**
 * @swagger
 * /api/sales/create:
 *   post:
 *     summary: Record a sale
 *     description: >
 *       Creates a sale order and deducts stock.  
 *       **Either `staff_id` or `created_by_user_id` must be provided.**  
 *       If `customer_id` is `0`, a placeholder "Walk-in" customer will be used (or created for that business if it does not exist).
 *     tags: [Sales]
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
 *               - items
 *               - total_amount
 *               - payment_mode
 *             properties:
 *               business_id:
 *                 type: integer
 *                 example: 1
 *               branch_id:
 *                 type: integer
 *                 example: 2
 *               staff_id:
 *                 type: string
 *                 nullable: true
 *                 example: "STAFF123"
 *                 description: Staff identifier if the sale was recorded by a staff member.
 *               created_by_user_id:
 *                 type: integer
 *                 nullable: true
 *                 example: 5
 *                 description: User ID if the sale was recorded by a system user (non-staff).
 *               customer_id:
 *                 type: integer
 *                 example: 0
 *                 description: >
 *                   ID of the customer.  
 *                   Use `0` for a walk-in customer.  
 *                   If omitted and `customer` object is provided, a new customer is created.
 *               customer:
 *                 type: object
 *                 nullable: true
 *                 properties:
 *                   name:
 *                     type: string
 *                   phone:
 *                     type: string
 *                   email:
 *                     type: string
 *               order_type:
 *                 type: string
 *                 example: "walk_in"
 *                 description: Optional. Type of the order (e.g., walk_in, online).
 *               items:
 *                 type: array
 *                 description: List of items in the sale
 *                 items:
 *                   type: object
 *                   required:
 *                     - variant_id
 *                     - quantity
 *                     - unit_price
 *                     - total_price
 *                   properties:
 *                     variant_id:
 *                       type: integer
 *                     quantity:
 *                       type: integer
 *                     unit_price:
 *                       type: number
 *                     total_price:
 *                       type: number
 *               total_amount:
 *                 type: number
 *                 example: 150.50
 *               payment_mode:
 *                 type: string
 *                 example: "cash"
 *               sale_type:
 *                 type: string
 *                 example: "regular"
 *                 enum: [regular, installment, credit]
 *               installment_plan:
 *                 type: object
 *                 nullable: true
 *                 properties:
 *                   down_payment:
 *                     type: number
 *                   remaining_balance:
 *                     type: number
 *                   number_of_payments:
 *                     type: integer
 *                   payment_frequency:
 *                     type: string
 *                     enum: [daily, weekly, monthly]
 *                   start_date:
 *                     type: string
 *                     format: date
 *                   notes:
 *                     type: string
 *               credit_details:
 *                 type: object
 *                 nullable: true
 *                 properties:
 *                   amount_paid:
 *                     type: number
 *                   balance:
 *                     type: number
 *                   credit_type:
 *                     type: string
 *                     enum: [full, partial, installment]
 *               discount:
 *                 type: number
 *                 nullable: true
 *               coupon:
 *                 type: string
 *                 nullable: true
 *               taxes:
 *                 type: number
 *                 nullable: true
 *               note:
 *                 type: string
 *                 nullable: true
 *                 example: "Customer paid exact cash"
 *     responses:
 *       201:
 *         description: Sale recorded successfully
 *       400:
 *         description: Missing required fields or validation failed
 *       500:
 *         description: Server error
 */
router.post('/create', ...requirePermission(SALES_PERMISSIONS.CREATE_SALE), rateLimitMiddleware, salesController.createSale);


/**
 * @swagger
 * /api/sales:
 *   get:
 *     summary: List all sales
 *     tags: [Sales]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of sales
 */
router.get('/', ...requirePermission(SALES_PERMISSIONS.VIEW_SALES), salesController.listSales);



/**
 * @swagger
 * /api/sales/staff_sales_kpis:
 *   get:
 *     summary: List all Staff sales and KPIs for the current day
 *     tags: [Sales]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of sales
 */
router.get('/staff_sales_kpis', ...requirePermission(SALES_PERMISSIONS.VIEW_SALES), salesController.listStaffSalesAndKpi);

/**
 * @swagger
 * /api/sales/{id}:
 *   get:
 *     summary: Get sale details
 *     tags: [Sales]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Sale ID
 *     responses:
 *       200:
 *         description: Sale details
 */
router.get('/:id', ...requirePermission(SALES_PERMISSIONS.VIEW_SALES), salesController.getSale);

/**
 * @swagger
 * /api/sales/refund/{id}:
 *   post:
 *     summary: Refund a sale
 *     tags: [Sales]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Sale ID
 *     responses:
 *       200:
 *         description: Sale refunded
 */
router.post('/refund/:id', authenticateToken, rateLimitMiddleware, salesController.refundSale);

/**
 * @swagger
 * /api/sales/advance-installment:
 *   post:
 *     summary: Advance an installment payment
 *     tags: [Sales]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [installment_payment_id, business_id, method, amount]
 *             properties:
 *               installment_payment_id:
 *                 type: integer
 *               business_id:
 *                 type: integer
 *               method:
 *                 type: string
 *               amount:
 *                 type: number
 *               reference:
 *                 type: string
 *     responses:
 *       200:
 *         description: Installment advanced successfully
 */
router.post('/advance-installment', ...requirePermission(SALES_PERMISSIONS.MANAGE_ORDERS), rateLimitMiddleware, salesController.advanceInstallment);

/**
 * @swagger
 * /api/sales/complete-installment:
 *   post:
 *     summary: Complete an installment plan
 *     tags: [Sales]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [plan_id, business_id]
 *             properties:
 *               plan_id:
 *                 type: integer
 *               business_id:
 *                 type: integer
 *               staff_id:
 *                 type: string
 *               created_by_user_id:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Installment plan completed and stock updated
 */
router.post('/complete-installment', ...requirePermission(SALES_PERMISSIONS.MANAGE_ORDERS),rateLimitMiddleware, salesController.completeInstallment);


/**
 * @swagger
 * /api/sales/credit-accounts/business/{business_id}:
 *   get:
 *     summary: Get all credit accounts for a business
 *     tags: [Sales]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: business_id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of credit accounts
 */
router.get('/credit-accounts/business/:business_id', ...requirePermission(SALES_PERMISSIONS.MANAGE_ORDERS), salesController.getBusinessCreditAccounts);


/**
 * @swagger
 * /api/sales/installment-plans/business/{business_id}:
 *   get:
 *     summary: Get all installment plans for a business
 *     tags: [Sales]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: business_id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of installment plans
 */
router.get('/installment-plans/business/:business_id', ...requirePermission(SALES_PERMISSIONS.MANAGE_ORDERS), salesController.getBusinessInstallmentPlans);

/**
 * @swagger
 * /api/sales/installment-plans/{plan_id}/payments:
 *   get:
 *     summary: Get payments for an installment plan
 *     tags: [Sales]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: plan_id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of installment payments
 */
router.get('/installment-plans/:plan_id/payments', ...requirePermission(SALES_PERMISSIONS.MANAGE_ORDERS), salesController.getInstallmentPayments);


/**
 * @swagger
 * /api/sales/credit-accounts/{id}:
 *   get:
 *     summary: Get details of a single credit account
 *     tags: [Sales]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Credit account details
 */
router.get('/credit-accounts/:id', ...requirePermission(SALES_PERMISSIONS.MANAGE_ORDERS), salesController.getCreditAccount);

/**
 * @swagger
 * /api/sales/credit-accounts/{id}/settle-installment:
 *   patch:
 *     summary: Mark an installment credit account as settled
 *     description: Directly marks a credit account's status as settled. Only applies to credit accounts where credit_type is 'installment'.
 *     tags: [Sales]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Credit account ID
 *     responses:
 *       200:
 *         description: Credit account marked as settled
 *       400:
 *         description: Invalid credit type or already settled
 *       404:
 *         description: Credit account not found
 *       500:
 *         description: Server error
 */
router.patch('/credit-accounts/:id/settle-installment', ...requirePermission(SALES_PERMISSIONS.MANAGE_ORDERS), salesController.settleCreditInstallmentAccount);

/**
 * @swagger
 * /api/sales/installment-plans/{plan_id}:
 *   get:
 *     summary: Get details of a single installment plan
 *     tags: [Sales]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: plan_id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Installment plan details
 */
router.get('/installment-plans/:plan_id', ...requirePermission(SALES_PERMISSIONS.MANAGE_ORDERS), salesController.getInstallmentPlan);

/**
 * @swagger
 * /api/sales/installment-payments/{payment_id}:
 *   get:
 *     summary: Get details of a single installment payment
 *     tags: [Sales]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: payment_id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Installment payment details
 */
router.get('/installment-payments/:payment_id', ...requirePermission(SALES_PERMISSIONS.MANAGE_ORDERS), salesController.getInstallmentPayment);


/**
 * @swagger
 * /api/sales/{id}:
 *   delete:
 *     summary: Delete a sale and refund inventory/clear logs
 *     tags: [Sales]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Sale deleted successfully
 */
router.delete('/:id', ...requirePermission(SALES_PERMISSIONS.MANAGE_ORDERS), salesController.deleteSale);


module.exports = router;
