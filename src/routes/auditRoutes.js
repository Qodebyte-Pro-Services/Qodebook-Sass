const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middlewares/authMiddleware');
const auditController = require('../controllers/auditController');

/**
 * @swagger
 * /api/audit/{business_id}/logs:
 *   get:
 *     summary: Get audit logs for a business
 *     tags: [Audit]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: business_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Business ID
 *       - in: query
 *         name: action_type
 *         schema:
 *           type: string
 *         description: Filter by action type (create, update, delete, etc.)
 *       - in: query
 *         name: resource_type
 *         schema:
 *           type: string
 *         description: Filter by resource type (product, stock, sale, etc.)
 *       - in: query
 *         name: user_id
 *         schema:
 *           type: integer
 *         description: Filter by user ID
 *       - in: query
 *         name: staff_id
 *         schema:
 *           type: integer
 *         description: Filter by staff ID
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for filtering
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for filtering
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Number of records to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of records to skip
 *     responses:
 *       200:
 *         description: Audit logs retrieved successfully
 *       403:
 *         description: Access denied
 */
router.get('/:business_id/logs', authenticateToken, auditController.getAuditLogs);

/**
 * @swagger
 * /api/audit/{business_id}/stats:
 *   get:
 *     summary: Get audit statistics for a business
 *     tags: [Audit]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: business_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Business ID
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for statistics
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for statistics
 *     responses:
 *       200:
 *         description: Audit statistics retrieved successfully
 *       403:
 *         description: Access denied
 */
router.get('/:business_id/stats', authenticateToken, auditController.getAuditStats);

/**
 * @swagger
 * /api/audit/{business_id}/resource/{resource_type}/{resource_id}:
 *   get:
 *     summary: Get audit logs for a specific resource
 *     tags: [Audit]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: business_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Business ID
 *       - in: path
 *         name: resource_type
 *         required: true
 *         schema:
 *           type: string
 *         description: Resource type (product, stock, sale, etc.)
 *       - in: path
 *         name: resource_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Resource ID
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of records to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of records to skip
 *     responses:
 *       200:
 *         description: Resource audit logs retrieved successfully
 *       403:
 *         description: Access denied
 */
router.get('/:business_id/resource/:resource_type/:resource_id', authenticateToken, auditController.getResourceAuditLogs);

/**
 * @swagger
 * /api/audit/{business_id}/user-activity:
 *   get:
 *     summary: Get user activity summary
 *     tags: [Audit]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: business_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Business ID
 *       - in: query
 *         name: user_id
 *         schema:
 *           type: integer
 *         description: Filter by user ID
 *       - in: query
 *         name: staff_id
 *         schema:
 *           type: integer
 *         description: Filter by staff ID
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for filtering
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for filtering
 *     responses:
 *       200:
 *         description: User activity summary retrieved successfully
 *       403:
 *         description: Access denied
 */
router.get('/:business_id/user-activity', authenticateToken, auditController.getUserActivity);

/**
 * @swagger
 * /api/audit/{business_id}/export:
 *   get:
 *     summary: Export audit logs
 *     tags: [Audit]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: business_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Business ID
 *       - in: query
 *         name: action_type
 *         schema:
 *           type: string
 *         description: Filter by action type
 *       - in: query
 *         name: resource_type
 *         schema:
 *           type: string
 *         description: Filter by resource type
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for filtering
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for filtering
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [json, csv]
 *           default: json
 *         description: Export format
 *     responses:
 *       200:
 *         description: Audit logs exported successfully
 *       403:
 *         description: Access denied
 */
router.get('/:business_id/export', authenticateToken, auditController.exportAuditLogs);

module.exports = router; 