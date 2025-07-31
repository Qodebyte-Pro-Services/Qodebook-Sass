const jwt = require('jsonwebtoken');

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.sendStatus(401);
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    if (user.business_id) req.user.business_id = user.business_id;
    if (user.branch_id) req.user.branch_id = user.branch_id;
    next();
  });
}

module.exports = { authenticateToken };
