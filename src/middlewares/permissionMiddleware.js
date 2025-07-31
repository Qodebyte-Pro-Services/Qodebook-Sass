
module.exports = (requiredPermission) => (req, res, next) => {
  const staff = req.user?.staff;
  if (!staff || !staff.permissions) return res.status(403).json({ message: 'No staff permissions found.' });
  const permissions = Array.isArray(staff.permissions)
    ? staff.permissions
    : (typeof staff.permissions === 'string' ? staff.permissions.split(',') : []);
  if (!permissions.includes(requiredPermission)) {
    return res.status(403).json({ message: 'Insufficient permissions.' });
  }
  next();
};
