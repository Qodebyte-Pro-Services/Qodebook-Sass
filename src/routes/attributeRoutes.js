const express = require('express');
const router = express.Router();
const { requirePermission, requireAuthOnly } = require('../utils/routeHelpers');
const { PRODUCT_PERMISSIONS } = require('../constants/permissions');
// const { validateAttribute, validateAttributeValue } = require('../middlewares/validateInput');
const attributeController = require('../controllers/attributeController');

/**
 * @swagger
 * /api/attributes:
 *   post:
 *     summary: Create attribute
 *     tags: [Attribute]
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
 *                 type: string
 *               name:
 *                 type: string
 *     responses:
 *       201:
 *         description: Attribute created
 *       409:
 *         description: Attribute name already exists
 */
router.post('/', ...requirePermission(PRODUCT_PERMISSIONS.CREATE_PRODUCT_ATTRIBUTES), attributeController.createAttribute);


/**
 * @swagger
 * /api/attributes/bulk:
 *   post:
 *      summary: Create multiple attributes and their values
 *      tags: [Attribute]
 *      security:
 *         - bearerAuth: []
 *      requestBody:
 *        required: true
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                business_id:
 *                  type: string
 *                attributes:
 *                  type: array
 *                items:
 *                  type: object
 *                  properties:
 *                    name:
 *                      type: string
 *                    values:
 *                      type: object
 *                      properties:
 *                        values1:
 *                          type: string
 *                        values2:
 *                          type: string
 *      responses:
 *        201:
 *          description: Attributes created or skipped if they already exist
 */
router.post('/bulk', ...requirePermission(PRODUCT_PERMISSIONS.CREATE_ATTRIBUTE_AND_VALUES), attributeController.createAttributesBulk);

/**
 * @swagger
 * /api/attributes:
 *   get:
 *     summary: List all attributes and values
 *     tags: [Attribute]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: business_id
 *         schema:
 *           type: string
 *         required: false
 *         description: Filter by business
 *     responses:
 *       200:
 *         description: List of attributes and values
 */
router.get('/', ...requireAuthOnly(), attributeController.listAttributes);

/**
 * @swagger
 * /api/attributes/{id}/values:
 *   post:
 *     summary: Add value to attribute
 *     tags: [Attribute]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Attribute ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               value:
 *                 type: string
 *     responses:
 *       201:
 *         description: Attribute value added
 *       409:
 *         description: Attribute value already exists
 */
router.post('/:id/values', ...requirePermission(PRODUCT_PERMISSIONS.MANAGE_ATTRIBUTES), attributeController.addAttributeValue);

/**
 * @swagger
 * /api/attributes/{id}:
 *   get:
 *     summary: Get attribute by ID
 *     tags: [Attribute]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Attribute ID
 *     responses:
 *       200:
 *         description: Attribute found
 *       404:
 *         description: Attribute not found
 */
router.get('/:id', ...requireAuthOnly(), attributeController.getAttribute);

/**
 * @swagger
 * /api/attributes/{id}:
 *   delete:
 *     summary: Delete attribute
 *     tags: [Attribute]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Attribute ID
 *     responses:
 *       200:
 *         description: Attribute deleted
 */
router.delete('/:id', ...requirePermission(PRODUCT_PERMISSIONS.DELETE_PRODUCT_ATTRIBUTES), attributeController.deleteAttribute);

/**
 * @swagger
 * /api/attributes/{id}/values/{valueId}:
 *   get:
 *     summary: Get attribute value by ID
 *     tags: [Attribute]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Attribute ID
 *       - in: path
 *         name: valueId
 *         schema:
 *           type: string
 *         required: true
 *         description: Attribute Value ID
 *     responses:
 *       200:
 *         description: Attribute value found
 *       404:
 *         description: Attribute value not found
 */
router.get('/:id/values/:valueId', ...requireAuthOnly(), attributeController.getAttributeValue);

/**
 * @swagger
 * /api/attributes/{id}/values/{valueId}:
 *   delete:
 *     summary: Delete attribute value
 *     tags: [Attribute]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Attribute ID
 *       - in: path
 *         name: valueId
 *         schema:
 *           type: string
 *         required: true
 *         description: Attribute Value ID
 *     responses:
 *       200:
 *         description: Attribute value deleted
 */
router.delete('/:id/values/:valueId', ...requirePermission(PRODUCT_PERMISSIONS.DELETE_ATTRIBUTE_VALUES), attributeController.deleteAttributeValue);

/**
 * @swagger
 * /api/attributes/business/{business_id}:
 *   get:
 *     summary: Get all attributes for a business
 *     tags: [Attribute]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: business_id
 *         schema:
 *           type: string
 *         required: true
 *         description: Business ID
 *     responses:
 *       200:
 *         description: List of attributes for the business
 */
router.get('/business/:business_id', ...requireAuthOnly(), async (req, res) => {
  try {
    const { business_id } = req.params;
    const result = await require('../controllers/attributeController').listAttributes({ query: { business_id } }, res);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
});

module.exports = router;
