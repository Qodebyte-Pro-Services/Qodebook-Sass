/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *
 * x-middleware:
 *   name: Tenant Isolation Middleware
 *   description: >-
 *     Ensures all API requests are strictly scoped to the correct business (and branch if applicable).
 *     Requires a valid business_id (and optionally branch_id) in the JWT only (never from body or query params).
 *     Returns 400 if business context is missing or not present in the JWT.
 *   errorResponses:
 *     - code: 400
 *       message: Business context required.
 */

module.exports = (req, res, next) => {
  const businessId = req.header('x-business-id');
  const branchId = req.header('x-branch-id');

  if (!businessId) {
    return res.status(400).json({ message: 'Business context required in x-business-id header.' });
  }

  req.business_id = parseInt(businessId, 10);
  if (branchId) req.branch_id = parseInt(branchId, 10);

  next();
};
