

const express = require('express');
const router = express.Router();
const controller = require('../controllers/analyticsController');
const auth = require('../middlewares/authMiddleware');
const { requirePermission, requireAuthOnly } = require('../utils/routeHelpers');
const { REPORTS_ANALYTICS_PERMISSIONS, FINANCIAL_PERMISSIONS} = require('../constants/permissions');
const rateLimitMiddleware = require('../middlewares/rateLimitMiddleware');

/**
 * @swagger
 * /api/finance/category-stock-distribution:
 *   get:
 *     summary: Get total stock distribution by product category (for pie chart)
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: business_id
 *         schema:
 *           type: string
 *         required: true
 *         description: Business ID to filter
 *       - in: query
 *         name: date_filter
 *         schema:
 *           type: string
 *           enum: [today, yesterday, last_7_days, this_month, this_year, custom]
 *         description: Date filter type (optional)
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Custom start date (YYYY-MM-DD, required if date_filter=custom)
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Custom end date (YYYY-MM-DD, required if date_filter=custom)
 *     responses:
 *       200:
 *         description: Category stock distribution data
 */
router.get(
  '/category-stock-distribution',
  ...requirePermission(REPORTS_ANALYTICS_PERMISSIONS.VIEW_STOCK_OVERVIEW),
  controller.categoryStockDistribution
);

/**
 * @swagger
 * /api/finance/income-expense-overtime:
 *   get:
 *     summary: Get income vs expense over time (hour, day, week, month, year)
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: business_id
 *         schema:
 *           type: string
 *         description: Business ID to filter
 *       - in: query
 *         name: branch_id
 *         schema:
 *           type: string
 *         description: Branch ID to filter
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [hour, day, week, month, year]
 *         description: Period to group by
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Custom start date (YYYY-MM-DD)
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Custom end date (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Income vs expense over time data
 */
router.get('/income-expense-overtime', ...requirePermission(FINANCIAL_PERMISSIONS.VIEW_FINANCIAL_REPORTS), controller.incomeExpenseOverTime);

/**
 * @swagger
 * /api/finance/gross-net-profit-overtime:
 *   get:
 *     summary: Get gross vs net profit over time (hour, day, week, month, year)
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: business_id
 *         schema:
 *           type: string
 *         description: Business ID to filter
 *       - in: query
 *         name: branch_id
 *         schema:
 *           type: string
 *         description: Branch ID to filter
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [hour, day, week, month, year]
 *         description: Period to group by
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Custom start date (YYYY-MM-DD)
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Custom end date (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Gross vs net profit over time data
 */
router.get('/gross-net-profit-overtime', ...requirePermission(FINANCIAL_PERMISSIONS.VIEW_FINANCIAL_REPORTS), controller.grossNetProfitOverTime);

/**
 * @swagger
 * /api/finance/expense-overtime:
 *   get:
 *     summary: Get expense over time (hour, day, week, month, year)
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: business_id
 *         schema:
 *           type: string
 *         description: Business ID to filter
 *       - in: query
 *         name: branch_id
 *         schema:
 *           type: string
 *         description: Branch ID to filter
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [hour, day, week, month, year]
 *         description: Period to group by
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Custom start date (YYYY-MM-DD)
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Custom end date (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Expense over time data
 */
router.get('/expense-overtime', ...requirePermission(FINANCIAL_PERMISSIONS.VIEW_EXPENSE_OVERVIEW), controller.expenseOverTime);

/**
 * @swagger
 * /api/finance/budget-overtime:
 *   get:
 *     summary: Get budget over time (hour, day, week, month, year)
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: business_id
 *         schema:
 *           type: string
 *         description: Business ID to filter
 *       - in: query
 *         name: branch_id
 *         schema:
 *           type: string
 *         description: Branch ID to filter
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [hour, day, week, month, year]
 *         description: Period to group by
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Custom start date (YYYY-MM-DD)
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Custom end date (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Budget over time data
 */
router.get('/budget-overtime', ...requirePermission(FINANCIAL_PERMISSIONS.VIEW_BUDGETS_OVERVIEW), controller.budgetOverTime);

/**
 * @swagger
 * /api/finance/budget-allocation-category:
 *   get:
 *     summary: Get budget allocation by expense category over time (hour, day, week, month, year)
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: business_id
 *         schema:
 *           type: string
 *         description: Business ID to filter
 *       - in: query
 *         name: branch_id
 *         schema:
 *           type: string
 *         description: Branch ID to filter
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [hour, day, week, month, year]
 *         description: Period to group by
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Custom start date (YYYY-MM-DD)
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Custom end date (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Budget allocation by category data
 */
router.get('/budget-allocation-category', ...requirePermission(FINANCIAL_PERMISSIONS.VIEW_BUDGETS_OVERVIEW), controller.budgetAllocationByCategory);

/**
 * @swagger
 * /api/finance/tax-flow-overtime:
 *   get:
 *     summary: Get tax flow over time (hour, day, week, month, year)
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: business_id
 *         schema:
 *           type: string
 *         description: Business ID to filter
 *       - in: query
 *         name: branch_id
 *         schema:
 *           type: string
 *         description: Branch ID to filter
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [hour, day, week, month, year]
 *         description: Period to group by
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Custom start date (YYYY-MM-DD)
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Custom end date (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Tax flow over time data
 */
router.get('/tax-flow-overtime', ...requirePermission(FINANCIAL_PERMISSIONS.VIEW_FINANCIAL_REPORTS), controller.taxFlowOverTime);

/**
 * @swagger
 * /api/finance/customer-analytics:
 *   get:
 *     summary: Get customer analytics (acquisition, retention, segmentation, lifetime value, activity)
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: business_id
 *         schema:
 *           type: string
 *         description: Business ID to filter
 *       - in: query
 *         name: branch_id
 *         schema:
 *           type: string
 *         description: Branch ID to filter
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *         description: Period to group by
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Custom start date (YYYY-MM-DD)
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Custom end date (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Customer analytics data
 */
router.get('/customer-analytics', ...requirePermission(REPORTS_ANALYTICS_PERMISSIONS.VIEW_CUSTOMER_OVERVIEW), controller.customerAnalytics);

/**
 * @swagger
 * /api/finance/supplier-analytics:
 *   get:
 *     summary: Get supplier analytics (performance, delivery times, cost trends)
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: business_id
 *         schema:
 *           type: string
 *         description: Business ID to filter
 *       - in: query
 *         name: branch_id
 *         schema:
 *           type: string
 *         description: Branch ID to filter
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *         description: Period to group by
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Custom start date (YYYY-MM-DD)
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Custom end date (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Supplier analytics data
 */
router.get('/supplier-analytics', ...requirePermission(REPORTS_ANALYTICS_PERMISSIONS.VIEW_SUPPLIER_OVERVIEW), controller.supplierAnalytics);

/**
 * @swagger
 * /api/finance/expense-analytics:
 *   get:
 *     summary: Get expense analytics (trends, categories, anomalies)
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: business_id
 *         schema:
 *           type: string
 *         description: Business ID to filter
 *       - in: query
 *         name: branch_id
 *         schema:
 *           type: string
 *         description: Branch ID to filter
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *         description: Period to group by
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Custom start date (YYYY-MM-DD)
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Custom end date (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Expense analytics data
 */
router.get('/expense-analytics', ...requirePermission(REPORTS_ANALYTICS_PERMISSIONS.VIEW_EXPENSE_OVERVIEW), controller.expenseAnalytics);

/**
 * @swagger
 * /api/finance/service-analytics:
 *   get:
 *     summary: Get service analytics (usage, revenue, staff performance)
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: business_id
 *         schema:
 *           type: string
 *         description: Business ID to filter
 *       - in: query
 *         name: branch_id
 *         schema:
 *           type: string
 *         description: Branch ID to filter
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *         description: Period to group by
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Custom start date (YYYY-MM-DD)
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Custom end date (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Service analytics data
 */
router.get('/service-analytics', ...requirePermission(REPORTS_ANALYTICS_PERMISSIONS.VIEW_SERVICE_OVERVIEW), controller.serviceAnalytics);

/**
 * @swagger
 * /api/finance/inventory-analytics:
 *   get:
 *     summary: Get inventory turnover and aging analytics
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: business_id
 *         schema:
 *           type: string
 *         description: Business ID to filter
 *       - in: query
 *         name: branch_id
 *         schema:
 *           type: string
 *         description: Branch ID to filter
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *         description: Period to group by
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Custom start date (YYYY-MM-DD)
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Custom end date (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Inventory analytics data
 */
router.get('/inventory-analytics', ...requirePermission(REPORTS_ANALYTICS_PERMISSIONS.VIEW_INVENTORY_OVERVIEW), controller.inventoryAnalytics);

/**
 * @swagger
 * /api/finance/discount-analytics:
 *   get:
 *     summary: Get discount and coupon analytics (effectiveness, redemption, sales uplift)
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: business_id
 *         schema:
 *           type: string
 *         description: Business ID to filter
 *       - in: query
 *         name: branch_id
 *         schema:
 *           type: string
 *         description: Branch ID to filter
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *         description: Period to group by
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Custom start date (YYYY-MM-DD)
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Custom end date (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Discount analytics data
 */
router.get('/discount-analytics', ...requirePermission(REPORTS_ANALYTICS_PERMISSIONS.VIEW_DISCOUNT_OVERVIEW), controller.discountAnalytics);

/**
 * @swagger
 * /api/finance/audit-log-analytics:
 *   get:
 *     summary: Get audit log analytics (user actions, security events)
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: business_id
 *         schema:
 *           type: string
 *         description: Business ID to filter
 *       - in: query
 *         name: branch_id
 *         schema:
 *           type: string
 *         description: Branch ID to filter
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *         description: Period to group by
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Custom start date (YYYY-MM-DD)
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Custom end date (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Audit log analytics data
 */
router.get('/audit-log-analytics', ...requirePermission(REPORTS_ANALYTICS_PERMISSIONS.VIEW_AUDIT_LOG_OVERVIEW), controller.auditLogAnalytics);

/**
 * @swagger
 * /api/finance/appointment-analytics:
 *   get:
 *     summary: Get appointment analytics (bookings, cancellations, no-shows, revenue)
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: business_id
 *         schema:
 *           type: string
 *         description: Business ID to filter
 *       - in: query
 *         name: branch_id
 *         schema:
 *           type: string
 *         description: Branch ID to filter
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *         description: Period to group by
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Custom start date (YYYY-MM-DD)
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Custom end date (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Appointment analytics data
 */
router.get('/appointment-analytics', ...requirePermission(REPORTS_ANALYTICS_PERMISSIONS.VIEW_APPOINTMENT_OVERVIEW), controller.appointmentAnalytics);

/**
 * @swagger
 * /api/finance/loyalty-analytics:
 *   get:
 *     summary: Get loyalty and rewards analytics (points accrual, redemption, engagement)
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: business_id
 *         schema:
 *           type: string
 *         description: Business ID to filter
 *       - in: query
 *         name: branch_id
 *         schema:
 *           type: string
 *         description: Branch ID to filter
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *         description: Period to group by
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Custom start date (YYYY-MM-DD)
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Custom end date (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Loyalty analytics data
 */
router.get('/loyalty-analytics', ...requirePermission(REPORTS_ANALYTICS_PERMISSIONS.VIEW_LOYALTY_OVERVIEW), controller.loyaltyAnalytics);

/**
 * @swagger
 * /api/finance/realtime-analytics:
 *   get:
 *     summary: Get real-time analytics (latest sales, stock, staff activity)
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Real-time analytics data
 */
router.get('/realtime-analytics', ...requirePermission(REPORTS_ANALYTICS_PERMISSIONS.VIEW_REALTIME_OVERVIEW), controller.realtimeAnalytics);

/**
 * @swagger
 * /api/finance/overview:
 *   get:
 *     summary: Get finance analytics overview
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: business_id
 *         schema:
 *           type: string
 *         description: Business ID to filter
 *       - in: query
 *         name: branch_id
 *         schema:
 *           type: string
 *         description: Branch ID to filter
 *       - in: query
 *         name: date_filter
 *         schema:
 *           type: string
 *           enum: [today, yesterday, this_week, last_7_days, this_month, this_year, custom]
 *         description: Date filter type
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Custom start date (YYYY-MM-DD)
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Custom end date (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Finance analytics overview data
 */
router.get('/overview', ...requirePermission(FINANCIAL_PERMISSIONS.VIEW_FINANCIAL_REPORTS), controller.overview);

/**
 * @swagger
 * /api/finance/variation-analytics:
 *   get:
 *     summary: Get analytics for product variations (inventory value, potential sale value, COGS)
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: business_id
 *         schema:
 *           type: string
 *         description: Business ID to filter
 *       - in: query
 *         name: branch_id
 *         schema:
 *           type: string
 *         description: Branch ID to filter
 *       - in: query
 *         name: date_filter
 *         schema:
 *           type: string
 *           enum: [today, yesterday, this_week, last_7_days, this_month, this_year, custom]
 *         description: Date filter type
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Custom start date (YYYY-MM-DD)
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Custom end date (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Variation analytics data
 */
router.get('/variation-analytics', ...requirePermission(REPORTS_ANALYTICS_PERMISSIONS.VIEW_VARIANTS_OVERVIEW), controller.variationAnalytics);

/**
 * @swagger
 * /api/finance/product-analytics:
 *   get:
 *     summary: Get product-level analytics (top products, performance)
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: business_id
 *         schema:
 *           type: string
 *         description: Business ID to filter
 *       - in: query
 *         name: branch_id
 *         schema:
 *           type: string
 *         description: Branch ID to filter
 *       - in: query
 *         name: date_filter
 *         schema:
 *           type: string
 *           enum: [today, yesterday, this_week, last_7_days, this_month, this_year, custom]
 *         description: Date filter type
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Custom start date (YYYY-MM-DD)
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Custom end date (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Product analytics data
 */
router.get('/product-analytics', ...requirePermission(REPORTS_ANALYTICS_PERMISSIONS.VIEW_PRODUCT_OVERVIEW), controller.productAnalytics);

/**
 * @swagger
 * /api/finance/stock-analytics:
 *   get:
 *     summary: Get stock-level analytics (inventory, out-of-stock, low stock)
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: business_id
 *         schema:
 *           type: string
 *         description: Business ID to filter
 *       - in: query
 *         name: branch_id
 *         schema:
 *           type: string
 *         description: Branch ID to filter
 *     responses:
 *       200:
 *         description: Stock analytics data
 */
router.get('/stock-analytics', ...requirePermission(REPORTS_ANALYTICS_PERMISSIONS.VIEW_STOCK_OVERVIEW), controller.stockAnalytics);

/**
 * @swagger
 * /api/finance/sales-analytics:
 *   get:
 *     summary: Get sales-level analytics (orders, sales)
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: business_id
 *         schema:
 *           type: string
 *         description: Business ID to filter
 *       - in: query
 *         name: branch_id
 *         schema:
 *           type: string
 *         description: Branch ID to filter
 *       - in: query
 *         name: date_filter
 *         schema:
 *           type: string
 *           enum: [today, yesterday, this_week, last_7_days, this_month, this_year, custom]
 *         description: Date filter type
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Custom start date (YYYY-MM-DD)
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Custom end date (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Sales analytics data
 */
router.get('/sales-analytics', ...requirePermission(REPORTS_ANALYTICS_PERMISSIONS.VIEW_SALES_OVERVIEW), controller.salesAnalytics);

/**
 * @swagger
 * /api/finance/staff-analytics:
 *   get:
 *     summary: Get staff-level analytics (count, performance)
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: business_id
 *         schema:
 *           type: string
 *         description: Business ID to filter
 *       - in: query
 *         name: branch_id
 *         schema:
 *           type: string
 *         description: Branch ID to filter
 *       - in: query
 *         name: date_filter
 *         schema:
 *           type: string
 *           enum: [today, yesterday, this_week, last_7_days, this_month, this_year, custom]
 *         description: Date filter type
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Custom start date (YYYY-MM-DD)
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Custom end date (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Staff analytics data
 */
router.get('/staff-analytics', ...requirePermission(REPORTS_ANALYTICS_PERMISSIONS.VIEW_STAFF_OVERVIEW), controller.staffAnalytics);

/**
/**
 * @swagger
 * /api/finance/product-variant-stock-movement:
 *   get:
 *     summary: Get stock movement for all variants of a product (with SKU and movement flow)
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: business_id
 *         schema:
 *           type: string
 *         required: true
 *         description: Business ID to filter
 *       - in: query
 *         name: product_id
 *         schema:
 *           type: string
 *         required: true
 *         description: Product ID to filter
 *       - in: query
 *         name: branch_id
 *         schema:
 *           type: string
 *         description: Branch ID to filter (optional)
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [hour, day, week, month, year]
 *         description: Period to group by eg day default, week, month, year
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Custom start date (YYYY-MM-DD)
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Custom end date (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Product variant stock movement data
 */
router.get(
  '/product-variant-stock-movement',
  ...requirePermission(REPORTS_ANALYTICS_PERMISSIONS.VIEW_STOCK_MOVEMENT),
  controller.productVariantStockMovement
);

/**
 * @swagger
 * /api/finance/stock-movement-analytics:
 *   get:
 *     summary: Get stock movement analytics for variations across periods
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: business_id
 *         schema:
 *           type: string
 *         description: Business ID to filter
 *       - in: query
 *         name: branch_id
 *         schema:
 *           type: string
 *         description: Branch ID to filter
 *       - in: query
 *         name: variant_id
 *         schema:
 *           type: string
 *         description: Variant ID to filter
 *       - in: query
 *         name: product_id
 *         schema:
 *           type: string
 *         description: Product ID to filter
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [hour, day, week, month, year]
 *         description: Period to group by
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Custom start date (YYYY-MM-DD)
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Custom end date (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Stock movement analytics data
 */
router.get('/stock-movement-analytics', ...requirePermission(REPORTS_ANALYTICS_PERMISSIONS.VIEW_STOCK_MOVEMENT), controller.stockMovementAnalytics);

/**
 * @swagger
 * /api/finance/sales-movement-analytics:
 *   get:
 *     summary: Get sales movement analytics for variants/products over time
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: business_id
 *         schema:
 *           type: string
 *         description: Business ID to filter
 *       - in: query
 *         name: branch_id
 *         schema:
 *           type: string
 *         description: Branch ID to filter
 *       - in: query
 *         name: variant_id
 *         schema:
 *           type: string
 *         description: Variant ID to filter
 *       - in: query
 *         name: product_id
 *         schema:
 *           type: string
 *         description: Product ID to filter
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [hour, day, week, month, year]
 *         description: Period to group by
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Custom start date (YYYY-MM-DD)
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Custom end date (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Sales movement analytics data
 */
router.get('/sales-movement-analytics', ...requirePermission(REPORTS_ANALYTICS_PERMISSIONS.VIEW_SALES_MOVEMENT), controller.salesMovementAnalytics);


/**
 * @swagger
 * /api/finance/sales-overview:
 *   get:
 *     tags:
 *       - Financial Reports
 *     summary: Get Sales Overview
 *     description: >
 *       Retrieves a paginated sales overview for all product variants under a specific business (and optionally branch).
 *       Each variant includes its SKU, selling price, cost price, product name, total units sold, and total revenue.
 *       Requires `VIEW_FINANCIAL_REPORTS` permission.
 *     operationId: getSalesOverview
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: business_id
 *         in: query
 *         required: true
 *         description: The unique ID of the business to fetch sales data for.
 *         schema:
 *           type: string
 *           example: "1"
 *       - name: branch_id
 *         in: query
 *         required: false
 *         description: Filter results by a specific branch.
 *         schema:
 *           type: string
 *           example: "12"
 *       - name: page
 *         in: query
 *         required: false
 *         description: "Page number for pagination (default: 1)"
 *         schema:
 *           type: integer
 *           minimum: 1
 *           example: 1
 *       - name: pageSize
 *         in: query
 *         required: false
 *         description: "Number of records per page (default: 20)"
 *         schema:
 *           type: integer
 *           minimum: 1
 *           example: 20
 *     responses:
 *       '200':
 *         description: Successful response with sales overview data.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 page:
 *                   type: integer
 *                   example: 1
 *                 pageSize:
 *                   type: integer
 *                   example: 20
 *                 total:
 *                   type: integer
 *                   description: Total number of product variants.
 *                   example: 145
 *                 totalPages:
 *                   type: integer
 *                   example: 8
 *                 variants:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       variant_id:
 *                         type: string
 *                         example: "v1234"
 *                       sku:
 *                         type: string
 *                         example: "SKU-1234"
 *                       selling_price:
 *                         type: number
 *                         format: float
 *                         example: 29.99
 *                       cost_price:
 *                         type: number
 *                         format: float
 *                         example: 15.50
 *                       product_name:
 *                         type: string
 *                         example: "Modern Landing Page Template"
 *                       units_sold:
 *                         type: integer
 *                         example: 250
 *                       revenue:
 *                         type: number
 *                         format: float
 *                         example: 7497.50
 *       '400':
 *         description: Missing or invalid parameters.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "business_id is required."
 *       '403':
 *         description: Forbidden — user lacks `VIEW_FINANCIAL_REPORTS` permission.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Access denied. You do not have permission to view financial reports."
 *       '500':
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Failed to fetch sales overview."
 *                 error:
 *                   type: string
 *                   example: "Database connection error"
 */
router.get(
  '/sales-overview',
  ...requirePermission(FINANCIAL_PERMISSIONS.VIEW_FINANCIAL_REPORTS),
  controller.salesOverView
);

/**
 * @swagger
 * /api/finance/sales-report:
 *   get:
 *     summary: Generate sales report for a period
 *     description: >
 *       Generates a sales report synchronously (for short ranges) or queues it for asynchronous
 *       processing (for large ranges such as yearly or custom periods > 30 days).
 *       When queued, a `report_id` and `status_url` are returned for polling.
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: business_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Business ID
 *       - in: query
 *         name: branch_id
 *         schema:
 *           type: string
 *         description: Optional branch filter
 *       - in: query
 *         name: cashier
 *         schema:
 *           type: string
 *         description: Staff/cashier filter
 *       - in: query
 *         name: order_method
 *         schema:
 *           type: string
 *         description: Order method (maps to `order_type`)
 *       - in: query
 *         name: category_type
 *         schema:
 *           type: string
 *         description: Filter by category name
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [day, month, year, custom]
 *         description: Period to report
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Required for `custom` period
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Required for `custom` period
 *       - in: query
 *         name: summary
 *         schema:
 *           type: string
 *           enum: [true, false]
 *         description: Include summary data
 *       - in: query
 *         name: details
 *         schema:
 *           type: string
 *           enum: [true, false]
 *         description: Include order details (paginated)
 *       - in: query
 *         name: payment_methods
 *         schema:
 *           type: string
 *           enum: [true, false]
 *         description: Include payment method stats
 *       - in: query
 *         name: product_breakdown
 *         schema:
 *           type: string
 *           enum: [true, false]
 *         description: Include product breakdown
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number for details
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *         description: Page size for details
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [json, pdf]
 *         description: Output format
 *     responses:
 *       200:
 *         description: Report data (JSON or PDF stream)
 *       202:
 *         description: Report queued for async processing
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 report_id:
 *                   type: string
 *                 status_url:
 *                   type: string
 *
 * /api/finance/reports/status/{reportId}:
 *   get:
 *     summary: Get report status
 *     description: >
 *       Check the status of a previously requested report.
 *       Returns status (`pending`, `completed`, `failed`) and download link if available.
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reportId
 *         required: true
 *         schema:
 *           type: string
 *         description: Report ID
 *     responses:
 *       200:
 *         description: Report status information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 report_id:
 *                   type: string
 *                 status:
 *                   type: string
 *                   enum: [pending, completed, failed]
 *                 format:
 *                   type: string
 *                 created_at:
 *                   type: string
 *                   format: date-time
 *                 download_url:
 *                   type: string
 *                   nullable: true
 *                 error:
 *                   type: string
 *                   nullable: true
 *       404:
 *         description: Report not found
 *
 * /api/finance/reports/download/{reportId}:
 *   get:
 *     summary: Download completed report
 *     description: >
 *       Download a completed report file (PDF or JSON export).
 *       Only available once the report `status` is `completed`.
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reportId
 *         required: true
 *         schema:
 *           type: string
 *         description: Report ID
 *     responses:
 *       200:
 *         description: File download stream
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *           application/json:
 *             schema:
 *               type: object
 *       400:
 *         description: Report not ready
 *       404:
 *         description: Report not found
 */

router.get('/sales-report', ...requirePermission(REPORTS_ANALYTICS_PERMISSIONS.VIEW_SALES_REPORT), rateLimitMiddleware, controller.salesReport);
router.get(
  '/reports/status/:reportId',
  requirePermission(REPORTS_ANALYTICS_PERMISSIONS.VIEW_SALES_REPORT),
  controller.reportStatus
);
router.get(
  '/reports/download/:reportId',
  requirePermission(REPORTS_ANALYTICS_PERMISSIONS.VIEW_SALES_REPORT),
  controller.downloadReport
);

module.exports = router;
