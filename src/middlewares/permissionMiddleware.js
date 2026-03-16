const pool = require('../config/db');

const rolePermissionCache = new Map();

module.exports = (requiredPermission) => async (req, res, next) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({ message: 'Authentication required.' });
    }

    if (user.isStaff) {

      const roleId = user.role;

      let permissions = rolePermissionCache.get(roleId);

      if (!permissions) {
        const rolePermissionsResult = await pool.query(
          `SELECT permissions FROM staff_roles WHERE role_id = $1`,
          [roleId]
        );

        if (rolePermissionsResult.rows.length === 0) {
          return res.status(403).json({
            message: 'Role not found or permissions not assigned.'
          });
        }

        permissions = rolePermissionsResult.rows[0].permissions || [];

        rolePermissionCache.set(roleId, permissions);
      }

      const permissionSet = new Set(permissions);

      if (!permissionSet.has(requiredPermission)) {
        return res.status(403).json({
          message: 'Insufficient permissions.',
          required: requiredPermission
        });
      }

      return next();
    }

    const businessId =
      req.business_id ||
      req.body.business_id ||
      req.query.business_id ||
      req.params.business_id;

    if (!businessId) {
      return res.status(400).json({
        message: 'Business context required for permission verification.'
      });
    }

    const businessResult = await pool.query(
      'SELECT user_id FROM businesses WHERE id = $1',
      [businessId]
    );

    if (businessResult.rows.length === 0) {
      return res.status(404).json({ message: 'Business not found.' });
    }

    const businessOwner = businessResult.rows[0].user_id;

    if (user.user_id === businessOwner) {
      return next();
    }

    return res.status(403).json({
      message: 'Access denied. You must be the business owner or have the required staff permissions.'
    });

  } catch (error) {
    console.error('Permission middleware error:', error);
    return res.status(500).json({ message: 'Permission verification failed.' });
  }
};