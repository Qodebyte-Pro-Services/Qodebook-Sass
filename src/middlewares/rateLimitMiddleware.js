const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
const { RedisStore } = require('rate-limit-redis');
const { createClient } = require('redis');
const { ipKeyGenerator } = require('express-rate-limit');

const redisClient = createClient({ url: process.env.REDIS_URL });
redisClient.connect().catch(console.error);

const generateKey = (req) => {
  if (req.user?.staff_id) return `staff-${req.user.staff_id}`;
  if (req.user?.business_id) return `biz-${req.user.business_id}`;
  if (req.user?.user_id) return `usr-${req.user.user_id}`;
  return ipKeyGenerator(req);
};

const rateLimitHandler = (req, res, _next, options) => {
  const retryAfterSeconds = Math.ceil(options.windowMs / 1000);
  const keyType = req.user?.staff_id
    ? 'staff'
    : req.user?.business_id
    ? 'business'
    : req.user?.user_id
    ? 'user'
    : 'guest';

  res.status(429).json({
    success: false,
    message: options.message,
    retryAfter: `${retryAfterSeconds} seconds`,
    keyType,
  });
};

const createRateLimitMiddleware = ({ windowMs, max, message }) => {
  const limiter = rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: generateKey,
    handler: rateLimitHandler,
    store: new RedisStore({
      sendCommand: (...args) => redisClient.sendCommand(args),
    }),
  });

  const slowDownMiddleware = slowDown({
    windowMs,
    delayAfter: Math.floor(max * 0.5),
    delayMs: () => 500,
    keyGenerator: generateKey,
  });

  return (req, res, next) => {
    slowDownMiddleware(req, res, (err) => {
      if (err) return next(err);
      limiter(req, res, next);
    });
  };
};


const getStaffLimiter = createRateLimitMiddleware({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: 'Too many GET requests, please try again later.',
});

const getUserLimiter = createRateLimitMiddleware({
  windowMs: 15 * 60 * 1000,
  max: 400,
  message: 'Too many GET requests, please try again later.',
});

const getGuestLimiter = createRateLimitMiddleware({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: 'Too many GET requests, please try again later.',
});

const staffLimiter = createRateLimitMiddleware({
  windowMs: 15 * 60 * 1000,
  max: 150,
  message: 'Too many staff requests, please try again later.',
});

const userLimiter = createRateLimitMiddleware({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: 'Too many requests, please try again later.',
});

const guestLimiter = createRateLimitMiddleware({
  windowMs: 15 * 60 * 1000,
  max: 3,
  message: 'Too many attempts, please try again later.',
});

const rateLimitMiddleware = (req, res, next) => {
  if (req.method === 'GET') {
    if (req.user?.staff_id) return getStaffLimiter(req, res, next);
    if (req.user?.user_id) return getUserLimiter(req, res, next);
    return getGuestLimiter(req, res, next);
  }

  if (req.user?.staff_id) return staffLimiter(req, res, next);
  if (req.user?.user_id || req.user?.business_id) return userLimiter(req, res, next);

  return guestLimiter(req, res, next);
};

module.exports = { rateLimitMiddleware };
