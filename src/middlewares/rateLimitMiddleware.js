const rateLimit = require('express-rate-limit');


module.exports = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 200, 
  keyGenerator: (req) => {
    return req.user?.business_id || req.ip;
  },
  handler: (req, res) => {
    res.status(429).json({ message: 'Too many requests, please try again later.' });
  },
});
