const express = require('express');
const router = express.Router();
const { requirePermission, requireAuthOnly } = require('../utils/routeHelpers');
const { PRODUCT_PERMISSIONS } = require('../constants/permissions');
// const { validateAttribute, validateAttributeValue } = require('../middlewares/validateInput');
const attributeController = require('../controllers/attributeController');
const { rateLimitMiddleware } = require('../middlewares/rateLimitMiddleware');

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
router.post('/', ...requirePermission(PRODUCT_PERMISSIONS.CREATE_PRODUCT_ATTRIBUTES), rateLimitMiddleware, attributeController.createAttribute);


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
router.post('/bulk', ...requirePermission(PRODUCT_PERMISSIONS.CREATE_ATTRIBUTE_AND_VALUES), rateLimitMiddleware, attributeController.createAttributesBulk);

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
router.post('/:id/values', ...requirePermission(PRODUCT_PERMISSIONS.MANAGE_ATTRIBUTES), rateLimitMiddleware, attributeController.addAttributeValue);

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
 *   patch:
 *     tags:
 *       - Attribute
 *     summary: Update attribute and its values
 *     description: >
 *       Update attribute name and manage attribute values in a single request.
 *       You can rename the attribute, add new values, rename existing values, and remove values.
 *       Requires PRODUCT_PERMISSIONS.UPDATE_PRODUCT_ATTRIBUTES.
 *     operationId: updateAttribute
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Attribute ID to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: New attribute name (optional)
 *               values_to_add:
 *                 type: array
 *                 description: List of new values to add (strings)
 *                 items:
 *                   type: string
 *               values_to_update:
 *                 type: array
 *                 description: List of existing values to rename. Each item must include id and value.
 *                 items:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       description: Attribute value id
 *                     value:
 *                       type: string
 *                       description: New value text
 *               values_to_remove:
 *                 type: array
 *                 description: List of attribute value ids to delete
 *                 items:
 *                   type: integer
 *           example:
 *             name: "Color"
 *             values_to_add: ["Olive", "Teal"]
 *             values_to_update:
 *               - id: 12
 *                 value: "Navy"
 *             values_to_remove: [15, 16]
 *     responses:
 *       '200':
 *         description: Attribute updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Attribute updated."
 *                 attribute:
 *                   type: object
 *                   description: Updated attribute record
 *                 values:
 *                   type: array
 *                   items:
 *                     type: object
 *                   description: Current list of attribute values
 *                 summary:
 *                   type: object
 *                   properties:
 *                     added:
 *                       type: array
 *                       items: { type: object }
 *                     updated:
 *                       type: array
 *                       items: { type: object }
 *                     removed:
 *                       type: array
 *                       items: { type: integer }
 *                     skipped:
 *                       type: array
 *                       items: { type: object }
 *       '400':
 *         description: Bad request / nothing to update
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Nothing to update. Provide name and/or values_to_add/values_to_update/values_to_remove."
 *       '404':
 *         description: Attribute not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Attribute not found."
 *       '409':
 *         description: Conflict - attribute name already exists
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Attribute name already exists for this business."
 *       '500':
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
router.patch('/:id', ...requirePermission(PRODUCT_PERMISSIONS.UPDATE_PRODUCT_ATTRIBUTES), rateLimitMiddleware, attributeController.updateAttribute);

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
router.delete('/:id', ...requirePermission(PRODUCT_PERMISSIONS.DELETE_PRODUCT_ATTRIBUTES), rateLimitMiddleware, attributeController.deleteAttribute);

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
router.delete('/:id/values/:valueId', ...requirePermission(PRODUCT_PERMISSIONS.DELETE_ATTRIBUTE_VALUES), rateLimitMiddleware, attributeController.deleteAttributeValue);

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
