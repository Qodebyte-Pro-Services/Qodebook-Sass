
const db = require('../config/db');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { sendOTP, verifyOTP } = require('../services/otpService');


exports.signup = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: 'Name, email, and password required.' });
    const hashed = await bcrypt.hash(password, 10);
    const result = await db.query('INSERT INTO customers (name, email, phone, password) VALUES ($1, $2, $3, $4) RETURNING *', [name, email, phone, hashed]);
    await sendOTP(email, 'signup');
    res.status(201).json({ customer: result.rows[0], message: 'Signup successful. Please verify OTP.' });
  } catch (err) {
    res.status(500).json({ message: 'Signup failed', details: err.message });
  }
};


exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await db.query('SELECT * FROM customers WHERE email = $1', [email]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Customer not found.' });
    const customer = result.rows[0];
    if (!await bcrypt.compare(password, customer.password)) return res.status(401).json({ message: 'Invalid credentials.' });

    await sendOTP(email, 'login');

    const token = jwt.sign({ id: customer.id, email: customer.email,  business_id: customer.business_id, }, process.env.CUSTOMER_JWT_SECRET || process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, customer });
  } catch (err) {
    res.status(500).json({ message: 'Login failed', details: err.message });
  }
};


exports.me = async (req, res) => {
  try {
    const customer_id = req.user.id;
    const result = await db.query('SELECT * FROM customers WHERE id = $1', [customer_id]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Customer not found.' });
    res.json({ customer: result.rows[0] });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch profile', details: err.message });
  }
};


exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const result = await db.query('SELECT * FROM customers WHERE email = $1', [email]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Customer not found.' });
    await sendOTP(email, 'reset');
    res.json({ message: 'OTP sent to email.' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to send OTP', details: err.message });
  }
};


exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, new_password } = req.body;
    if (!await verifyOTP(email, otp, 'reset')) return res.status(400).json({ message: 'Invalid OTP.' });
    const hashed = await bcrypt.hash(new_password, 10);
    await db.query('UPDATE customers SET password = $1 WHERE email = $2', [hashed, email]);
    res.json({ message: 'Password reset successful.' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to reset password', details: err.message });
  }
};


exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp, purpose } = req.body;
    if (!await verifyOTP(email, otp, purpose)) return res.status(400).json({ message: 'Invalid OTP.' });
    res.json({ message: 'OTP verified.' });
  } catch (err) {
    res.status(500).json({ message: 'OTP verification failed', details: err.message });
  }
};

const socialAuthService = require('../services/socialAuthService');
exports.socialLogin = async (req, res) => {
  try {
    const { provider, token } = req.body;
    let profile;
    if (provider === 'google') {
      profile = await socialAuthService.verifyGoogleToken(token);
    } else if (provider === 'facebook') {
      profile = await socialAuthService.verifyFacebookToken(token);
    } else {
      return res.status(400).json({ message: 'Unsupported provider.' });
    }
  
    let result = await db.query('SELECT * FROM customers WHERE social_id = $1 AND provider = $2', [profile.social_id, provider]);
    let customer;
    if (result.rows.length === 0) {
      result = await db.query('INSERT INTO customers (name, email, social_id, provider, is_verified) VALUES ($1, $2, $3, $4, true) RETURNING *', [profile.name, profile.email, profile.social_id, provider]);
      customer = result.rows[0];
    } else {
      customer = result.rows[0];
    }
   
    const jwtToken = jwt.sign({ id: customer.id, email: customer.email, business_id:customer.business_id }, process.env.CUSTOMER_JWT_SECRET || process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token: jwtToken, customer });
  } catch (err) {
    res.status(500).json({ message: 'Social login failed', details: err.message });
  }
};
