

const express = require('express');
const router = express.Router();
const controller = require('../controllers/analyticsController');
const auth = require('../middlewares/authMiddleware');
const { requirePermission, requireAuthOnly } = require('../utils/routeHelpers');
const { REPORTS_ANALYTICS_PERMISSIONS, FINANCIAL_PERMISSIONS} = require('../constants/permissions');

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
 * /api/finance/sales-report:
 *   get:
 *     summary: Generate sales report for a period
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: business_id
 *         schema:
 *           type: string
 *         description: Business ID (required)
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
 *         description: Custom start date (YYYY-MM-DD)
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Custom end date (YYYY-MM-DD)
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
 *         description: Include order details
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
 *     responses:
 *       200:
 *         description: Sales report data
 */
router.get('/sales-report', ...requirePermission(REPORTS_ANALYTICS_PERMISSIONS.VIEW_SALES_REPORT), controller.salesReport);

module.exports = router;
