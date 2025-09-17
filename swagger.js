const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Qodebook SaaS API',
      version: '1.0.0',
      description: 'API documentation for Qodebook SaaS',
    },
    servers: [
      {
        url: 'https://qodebook-sass-api.qodebyte.com',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            first_name: { type: 'string' },
            last_name: { type: 'string' },
            email: { type: 'string' },
            phone: { type: 'string' },
            is_verified: { type: 'boolean' },
            is_social_media: { type: 'boolean' },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
          },
        },
        Variant: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            product_id: { type: 'integer' },
            attributes: { type: 'object' },
            cost_price: { type: 'number' },
            selling_price: { type: 'number' },
            quantity: { type: 'integer' },
            threshold: { type: 'integer' },
            sku: { type: 'string' },
            image_url: { type: 'string' },
            expiry_date: { type: 'string', format: 'date' },
            barcode: { type: 'string' },
            barcode_image_url: { type: 'string' },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./src/routes/*.js'],
};

const swaggerSpec = swaggerJsdoc(options);

function setupSwagger(app) {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}

module.exports = setupSwagger;
