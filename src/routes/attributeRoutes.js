const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middlewares/authMiddleware');
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
router.post('/', authenticateToken, attributeController.createAttribute);

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
router.get('/', authenticateToken, attributeController.listAttributes);

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
router.post('/:id/values', authenticateToken, attributeController.addAttributeValue);

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
router.get('/:id', authenticateToken, attributeController.getAttribute);

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
router.delete('/:id', authenticateToken, attributeController.deleteAttribute);

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
router.get('/:id/values/:valueId', authenticateToken, attributeController.getAttributeValue);

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
router.delete('/:id/values/:valueId', authenticateToken, attributeController.deleteAttributeValue);

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
router.get('/business/:business_id', authenticateToken, async (req, res) => {
  try {
    const { business_id } = req.params;
    const result = await require('../controllers/attributeController').listAttributes({ query: { business_id } }, res);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
});

module.exports = router;
