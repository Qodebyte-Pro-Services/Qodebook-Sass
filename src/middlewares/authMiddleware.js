const jwt = require('jsonwebtoken');

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, process.env.JWT_SECRET, (err, payload) => {
    if (err) return res.sendStatus(403);

   
    if (payload.staff_id) {
      req.user = {
        staff_id: payload.staff_id,
        business_id: payload.business_id,
        branch_id: payload.branch_id,
        email: payload.email,
        full_name: payload.full_name,
        role: payload.role,
        permissions: payload.permissions,
        isStaff: true
      };
    } 
   
    else if (payload.user_id) {
      req.user = {
        user_id: payload.user_id,
        email: payload.email,
        is_social_media: payload.is_social_media || false,
        isStaff: false
      };
      if (payload.business_id) req.user.business_id = payload.business_id;
      if (payload.branch_id) req.user.branch_id = payload.branch_id;
    } 

    else {
      return res.status(401).json({ message: 'Invalid token payload.' });
    }

    next();
  });
}


function authenticateCustomer(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.sendStatus(401);
  jwt.verify(token, process.env.CUSTOMER_JWT_SECRET || process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

module.exports = { authenticateToken, authenticateCustomer };
