

const { authenticateToken } = require('../middlewares/authMiddleware');
const permissionMiddleware = require('../middlewares/permissionMiddleware');
const tenantMiddleware = require('../middlewares/tenantMiddleware');


const requirePermission = (permission) => [
  authenticateToken,
  tenantMiddleware,
  permissionMiddleware(permission)
];

const requirePermissionOnly = (permission) => [
  authenticateToken,
  permissionMiddleware(permission)
];

const requireAuth = () => [
  authenticateToken,
  tenantMiddleware
];


const requireAuthOnly = () => [
  authenticateToken
];

module.exports = {
  requirePermission,
  requirePermissionOnly,
  requireAuth,
  requireAuthOnly
};
