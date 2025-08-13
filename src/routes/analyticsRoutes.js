const express = require('express');
const router = express.Router();
const controller = require('../controllers/analyticsController');
const auth = require('../middlewares/authMiddleware');
const { requirePermission, requireAuthOnly } = require('../utils/routeHelpers');
const { REPORTS_ANALYTICS_PERMISSIONS, FINANCIAL_PERMISSIONS} = require('../constants/permissions');


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
