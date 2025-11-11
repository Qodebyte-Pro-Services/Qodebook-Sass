
const express = require('express');
const router = express.Router();
const upload = require('../middlewares/upload');
const variantController = require('../controllers/variantController');
const { requirePermission, requireAuthOnly } = require('../utils/routeHelpers');
const { PRODUCT_PERMISSIONS } = require('../constants/permissions');
const { rateLimitMiddleware } = require('../middlewares/rateLimitMiddleware');
/**
 * @swagger
 * /api/variants/batch:
 *   post:
 *     summary: Batch create variants for a product
 *     tags: [Variant]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               product_id:
 *                 type: integer
 *               variants:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     sku:
 *                       type: string
 *                     cost_price:
 *                       type: number
 *                     selling_price:
 *                       type: number
 *                     attributes:
 *                       type: array
 *                       items:
 *                         type: string
 *                     barcode:
 *                       type: string
 *                     custom_price:
 *                       type: number
 *                     image_url:
 *                       type: string
 *                     expiry_date:
 *                       type: string
 *                       format: date
 *     responses:
 *       201:
 *         description: Batch variants created
 */

/**
 * @swagger
 * /api/variants/products/{id}/variants/generate:
 *   post:
 *     summary: Auto-generate variants from selected attributes
 *     tags: [Variant]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Product ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               variants:
 *                 type: string
 *                 description: JSON stringified array of variant objects
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Variants generated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 variants:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Variant'
 *       409:
 *         description: SKU already exists
 */

/**
 * @swagger
 * /api/variants/products/{id}/variants:
 *   get:
 *     summary: List variants for a product
 *     tags: [Variant]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Product ID
 *     responses:
 *       200:
 *         description: List of variants
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 variants:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Variant'
 */


/**
 * @swagger
 * /api/variants/product/{productId}/variants/{variantId}:
 *   get:
 *     summary: Get a specific variant of a product
 *     tags: [Variant]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         schema:
 *           type: string
 *         required: true
 *         description: Product ID
 *       - in: path
 *         name: variantId
 *         schema:
 *           type: string
 *         required: true
 *         description: Variant ID
 *     responses:
 *       200:
 *         description: Variant found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 variant:
 *                   $ref: '#/components/schemas/Variant'
 *       404:
 *         description: Variant not found for this product
 */

/**
 * @swagger
 * /api/variants/{variant_id}:
 *   put:
 *     summary: Update an existing variant
 *     tags: [Variant]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: variant_id
 *         schema:
 *           type: string
 *         required: true
 *         description: Variant ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               attributes:
 *                 type: object
 *                 description: JSON attributes for the variant
 *               cost_price:
 *                 type: number
 *                 format: float
 *               selling_price:
 *                 type: number
 *                 format: float
 *               threshold:
 *                 type: integer
 *               sku:
 *                 type: string
 *               expiry_date:
 *                 type: string
 *                 format: date
 *               barcode:
 *                 type: string
 *               image_url:
 *                 type: array
 *                 description: Existing images (JSON stringified array of objects `{ public_id, secure_url }`)
 *                 items:
 *                   type: string
 *               image_url_files:
 *                 type: array
 *                 description: Upload new images
 *                 items:
 *                   type: string
 *                   format: binary
 *               deleteImages:
 *                 type: array
 *                 description: Array of Cloudinary public_ids to delete
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Variant updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 variant:
 *                   $ref: '#/components/schemas/Variant'
 *       404:
 *         description: Variant not found
 *       500:
 *         description: Server error
 */


/**
 * @swagger
 * /api/variants/{variant_id}:
 *   put:
 *     tags:
 *       - Variant
 *     summary: Update an existing variant
 *     description: Update variant details, including fields, attributes, quantity, and image uploads. Supports partial updates and file uploads via multipart/form-data.
 *     security:
 *       - bearerAuth: []
 *     operationId: updateVariant
 *     parameters:
 *       - in: path
 *         name: variant_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Variant ID (UUID or string)
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               attributes:
 *                 oneOf:
 *                   - type: string
 *                     description: JSON stringified attributes
 *                   - type: object
 *                     description: Attributes object
 *               cost_price:
 *                 type: number
 *                 format: float
 *               selling_price:
 *                 type: number
 *                 format: float
 *               threshold:
 *                 type: integer
 *               quantity:
 *                 type: integer
 *               sku:
 *                 type: string
 *               expiry_date:
 *                 type: string
 *                 format: date
 *                 description: Accepts YYYY-MM-DD or common variants (validated internally)
 *               barcode:
 *                 type: string
 *               image_url:
 *                 type: array
 *                 description: Upload new image files (field name must be "image_url")
 *                 items:
 *                   type: string
 *                   format: binary
 *               deleteImages:
 *                 type: array
 *                 description: Array of Cloudinary public_ids to delete (send as JSON string in multipart)
 *                 items:
 *                   type: string
 *               replace_images:
 *                 type: string
 *                 enum: ["true", "false"]
 *                 description: If "true", replaces all existing images with uploaded ones. Default is "false".
 *           examples:
 *             update-with-images:
 *               summary: Update price and upload new images
 *               value:
 *                 selling_price: 19.99
 *                 image_url: (binary files)
 *                 deleteImages: ["old_public_id_1"]
 *                 replace_images: "false"
 *     responses:
 *       200:
 *         description: Variant updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Variant updated successfully."
 *                 variant:
 *                   $ref: '#/components/schemas/Variant'
 *       400:
 *         description: Bad request (e.g., no changes detected or invalid payload)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "No changes detected."
 *       404:
 *         description: Variant not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Variant not found."
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



/**
 * @swagger
 * /api/variants/{id}:
 *   get:
 *     summary: Get a specific variant by ID
 *     tags: [Variant]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Variant ID
 *     responses:
 *       200:
 *         description: Variant details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 variant:
 *                   $ref: '#/components/schemas/Variant'
 *       404:
 *         description: Variant not found
 */

/**
 * @swagger
 * /api/variants/business/variants:
 *   get:
 *     summary: Get all variants for a specific business
 *     tags: [Variant]
 *     parameters:
 *       - in: query
 *         name: business_id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the business to fetch variants for
 *     responses:
 *       200:
 *         description: List of variants for the given business
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 variants:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Variant'
 *       400:
 *         description: Missing or invalid business_id
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: business_id is required
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Server error
 */


/**
 * @swagger
 * /api/variants/count-in-stock:
 *   get:
 *     summary: Get count of variants in stock
 *     tags: [Variant]
 *     parameters:
 *       - in: query
 *         name: business_id
 *         schema:
 *           type: string
 *         required: false
 *         description: Business ID
 *       - in: query
 *         name: branch_id
 *         schema:
 *           type: string
 *         required: false
 *         description: Branch ID
 *     responses:
 *       200:
 *         description: Count of variants in stock
 */

/**
 * @swagger
 * /api/variants/generate-names:
 *   post:
 *     summary: Generate all possible variant names from product and attributes
 *     tags: [Variant]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               product_name:
 *                 type: string
 *                 example: "T-Shirt"
 *               attributes:
 *                 type: array
 *                 description: Array of attribute objects (optional)
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                       example: "Color"
 *                     values:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["Red", "Blue"]
 *               separator:
 *                 type: string
 *                 description: "Optional separator for variant names (default: ' - ')"
 *                 example: " / "
 *     responses:
 *       200:
 *         description: List of generated variant names
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 variant_names:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ["T-Shirt - Red - S", "T-Shirt - Blue - M"]
 */
/**
 * @swagger
 * /api/variants/{id}/barcode:
 *   patch:
 *     summary: Update the barcode of a specific variant
 *     tags: [Variant]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Variant ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               barcode:
 *                 type: string
 *             required:
 *               - barcode
 *     responses:
 *       200:
 *         description: Barcode successfully updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 variant:
 *                   $ref: '#/components/schemas/Variant'
 *       400:
 *         description: Barcode is missing from request
 *       500:
 *         description: Server error
 */
router.patch('/:id/barcode', ...requirePermission(PRODUCT_PERMISSIONS.MANAGE_VARIANTS), rateLimitMiddleware, variantController.updateBarcode);
router.get('/count-in-stock', ...requirePermission(PRODUCT_PERMISSIONS.MANAGE_VARIANTS), variantController.countVariantsInStock);
router.post('/products/:id/variants/generate', ...requirePermission(PRODUCT_PERMISSIONS.CREATE_PRODUCT_VARIANTS),upload.any(),rateLimitMiddleware,variantController.generateVariants);
router.post('/generate-names', ...requirePermission(PRODUCT_PERMISSIONS.MANAGE_VARIANTS), rateLimitMiddleware, variantController.generateVariantNames);
router.post('/batch', ...requirePermission(PRODUCT_PERMISSIONS.MANAGE_VARIANTS), rateLimitMiddleware, variantController.createVariantsBatch);
router.get('/products/:id/variants', ...requirePermission(PRODUCT_PERMISSIONS.VIEW_PRODUCT_VARIANTS), variantController.listVariants);
router.get('/product/:productId/variants/:variantId',...requirePermission(PRODUCT_PERMISSIONS.VIEW_PRODUCT_VARIANTS),variantController.getVariantByProduct);
router.get('/:id', ...requirePermission(PRODUCT_PERMISSIONS.VIEW_PRODUCT_VARIANTS), variantController.getVariantById);
router.get('/business/variants', ...requirePermission(PRODUCT_PERMISSIONS.VIEW_PRODUCT_VARIANTS), variantController.getVariantsByBusiness);
router.put('/:variant_id', ...requirePermission(PRODUCT_PERMISSIONS.UPDATE_PRODUCT_VARIANTS), upload.any(), rateLimitMiddleware, variantController.updateVariant);
router.delete('/:id', ...requirePermission(PRODUCT_PERMISSIONS.DELETE_PRODUCT_VARIANTS), rateLimitMiddleware, variantController.deleteVariant);

module.exports = router;
