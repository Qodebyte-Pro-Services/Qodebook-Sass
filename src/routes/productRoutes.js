
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middlewares/authMiddleware');
// const { validateProduct } = require('../middlewares/validateInput');
const upload = require('../middlewares/upload');
const productController = require('../controllers/productController');

/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Create product
 *     tags: [Product]
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
 *               category_id:
 *                 type: string
 *               name:
 *                 type: string
 *               brand:
 *                 type: string
 *               description:
 *                 type: string
 *               base_sku:
 *                 type: string
 *               image_url:
 *                 type: string
 *               taxable:
 *                 type: boolean
 *               threshold:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Product created
 *       409:
 *         description: Product name already exists
 */
/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Create product
 *     tags: [Product]
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
 *                 type: string
 *               category_id:
 *                 type: string
 *               name:
 *                 type: string
 *               brand:
 *                 type: string
 *               description:
 *                 type: string
 *               base_sku:
 *                 type: string
 *               image:
 *                 type: string
 *                 format: binary
 *               taxable:
 *                 type: boolean
 *               threshold:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Product created
 *       409:
 *         description: Product name already exists
 */
router.post('/', authenticateToken, upload.single('image'), productController.createProduct);

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: List all products
 *     tags: [Product]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of products
 */
router.get('/', authenticateToken, productController.listProducts);

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: Get product by ID
 *     tags: [Product]
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
 *         description: Product found
 *       404:
 *         description: Product not found
 */
router.get('/:id', authenticateToken, productController.getProduct);

/**
 * @swagger
 * /api/products/{id}:
 *   put:
 *     summary: Update product
 *     tags: [Product]
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
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               brand:
 *                 type: string
 *               description:
 *                 type: string
 *               base_sku:
 *                 type: string
 *               image_url:
 *                 type: string
 *               taxable:
 *                 type: boolean
 *               threshold:
 *                 type: integer
 *               category_id:
 *                 type: string
 *     responses:
 *       200:
 *         description: Product updated
 *       404:
 *         description: Product not found
 */
/**
 * @swagger
 * /api/products/{id}:
 *   put:
 *     summary: Update product
 *     tags: [Product]
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
 *               name:
 *                 type: string
 *               brand:
 *                 type: string
 *               description:
 *                 type: string
 *               base_sku:
 *                 type: string
 *               image:
 *                 type: string
 *                 format: binary
 *               taxable:
 *                 type: boolean
 *               threshold:
 *                 type: integer
 *               category_id:
 *                 type: string
 *     responses:
 *       200:
 *         description: Product updated
 *       404:
 *         description: Product not found
 */
router.put('/:id', authenticateToken, upload.single('image'), productController.updateProduct);

/**
 * @swagger
 * /api/products/{id}:
 *   delete:
 *     summary: Delete product
 *     tags: [Product]
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
 *         description: Product deleted
 */
router.delete('/:id', authenticateToken, productController.deleteProduct);

/**
 * @swagger
 * /api/products/category/{id}:
 *   get:
 *     summary: Get products by category
 *     tags: [Product]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Category ID
 *     responses:
 *       200:
 *         description: List of products for the category
 */
router.get('/category/:id', authenticateToken, productController.getProductsByCategory);

/**
 * @swagger
 * /api/products/business/{id}:
 *   get:
 *     summary: Get products by business
 *     tags: [Product]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Business ID
 *     responses:
 *       200:
 *         description: List of products for the business
 */
router.get('/business/:id', authenticateToken, productController.getProductsByBusiness);

/**
 * @swagger
 * /api/products/count-in-stock:
 *   get:
 *     summary: Get count of products in stock
 *     tags: [Product]
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
 *         description: Count of products in stock
 */
router.get('/count-in-stock', require('../middlewares/authMiddleware').authenticateToken, require('../controllers/productController').countProductsInStock);

module.exports = router;
