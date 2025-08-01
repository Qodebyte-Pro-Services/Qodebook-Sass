
const { body, validationResult } = require('express-validator');

const validateSignup = [
  body('first_name').notEmpty().withMessage('First name is required'),
  body('last_name').notEmpty().withMessage('Last name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('phone').optional(),
 
  body('password')
    .if(body('is_social_media').custom(value => !value))
         .isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
    .notEmpty().withMessage('Password is required'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];

const validateLogin = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];




const validateBusiness = [
  body('business_name').optional().notEmpty().withMessage('Business name is required'),
  body('business_type').optional().notEmpty().withMessage('Business type is required'),
  body('address').optional().notEmpty().withMessage('Address is required'),
  body('business_phone').optional().notEmpty().withMessage('Business phone is required'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    if (req.method === 'POST') {
      const { business_name, business_type, address, business_phone } = req.body;
      if (!business_name || !business_type || !address || !business_phone) {
        return res.status(400).json({ message: 'All fields are required.' });
      }
    }
    next();
  }
];


const validateBranch = [
  body('business_id').notEmpty().withMessage('Business ID is required'),
  body('branch_name').notEmpty().withMessage('Branch name is required'),
  body('location').notEmpty().withMessage('Branch location is required'),
  body('branch_manager').optional(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];


const validateBranchUpdate = [
  body('branch_name').optional().notEmpty().withMessage('Branch name is required'),
  body('location').optional().notEmpty().withMessage('Branch location is required'),
  body('branch_manager').optional(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { branch_name, location, branch_manager } = req.body;
    if (!branch_name && !location && !branch_manager) {
      return res.status(400).json({ message: 'At least one field is required to update.' });
    }
    next();
  }
];

module.exports = { validateSignup, validateLogin, validateBusiness, validateBranch, validateBranchUpdate };
