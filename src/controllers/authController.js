


const { verifyGoogleToken } = require('../services/socialAuthService');


const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const { sendOtpEmail } = require('../services/emailService');

exports.verifyOtp = async (req, res) => {
  try {
    const { user_id, otp, purpose } = req.body;
    if (!user_id || !otp || !purpose) {
      return res.status(400).json({ message: 'user_id, otp, and purpose are required.' });
    }
    const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [user_id]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }
    const user = userResult.rows[0];
    const otpResult = await pool.query(
      'SELECT * FROM user_otps WHERE user_id = $1 AND otp_code = $2 AND purpose = $3 AND used = false AND expires_at > NOW()',
      [user_id, otp, purpose]
    );
    if (otpResult.rows.length === 0) {
      return res.status(400).json({ message: 'Invalid or expired OTP.' });
    }
    
    await pool.query('UPDATE user_otps SET used = true WHERE id = $1', [otpResult.rows[0].id]);
   
    if (purpose === 'register' && !user.is_verified) {
      await pool.query('UPDATE users SET is_verified = true WHERE id = $1', [user_id]);
      const token = jwt.sign({ user_id: user.id, email: user.email, is_social_media: user.is_social_media }, process.env.JWT_SECRET, { expiresIn: '7d' });
      return res.status(200).json({ message: 'OTP verified. Registration complete.', token });
    }
    if (purpose === 'login') {
      const token = jwt.sign({ user_id: user.id, email: user.email, is_social_media: user.is_social_media }, process.env.JWT_SECRET, { expiresIn: '7d' });
      return res.status(200).json({ message: 'OTP verified. Login successful.', token });
    }

   if (purpose === 'reset') {
      const resetToken = jwt.sign({ user_id: user.id, email: user.email, purpose: 'reset' }, process.env.JWT_SECRET,{ expiresIn: '10m' });
      return res.status(200).json({ message: 'OTP verified. Proceed to reset password.', token: resetToken });
    }

    return res.status(200).json({ message: 'OTP verified.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

exports.googleLogin = async (req, res) => {
  try {
    const { idToken } = req.body;
    if (!idToken) return res.status(400).json({ message: 'Missing Google ID token.' });
    const googleUser = await verifyGoogleToken(idToken);
    if (!googleUser) return res.status(401).json({ message: 'Invalid Google token.' });

    
    let userResult = await pool.query('SELECT * FROM users WHERE email = $1', [googleUser.email]);
    let user;
    if (userResult.rows.length === 0) {
      
      const insertUserQuery = `INSERT INTO users (first_name, last_name, email, phone, is_social_media, is_verified) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, email`;
      userResult = await pool.query(insertUserQuery, [googleUser.firstName, googleUser.lastName, googleUser.email, null, true, true]);
      user = userResult.rows[0];
    } else {
      user = userResult.rows[0];
    }

    if (!user.is_verified) {
  await pool.query(`UPDATE users SET is_verified = true WHERE id = $1`, [user.id]);
}

    const token = jwt.sign({ user_id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' });
    return res.status(200).json({ message: 'Google login successful.', token });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

exports.signup = async (req, res) => {
  try {
    const { first_name, last_name, email, phone, password, is_social_media } = req.body;
    if (!first_name || !last_name || !email || (!is_social_media && !password)) {
      return res.status(400).json({ message: 'Missing required fields.' });
    }

    const userCheck = await pool.query('SELECT * FROM users WHERE email = $1 OR phone = $2', [email, phone]);
    if (userCheck.rows.length > 0) {
      return res.status(409).json({ message: 'User with this email or phone already exists.' });
    }

    let hashedPassword = null;
    if (!is_social_media) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    const insertUserQuery = `INSERT INTO users (first_name, last_name, email, phone, password, is_social_media, is_verified) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, email, is_social_media`;
    const isVerified = is_social_media ? true : false;
    const userResult = await pool.query(insertUserQuery, [first_name, last_name, email, phone, hashedPassword, !!is_social_media, isVerified]);
    const user = userResult.rows[0];

    if (!is_social_media) {
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); 
      await pool.query(
        `INSERT INTO user_otps (user_id, otp_code, purpose, expires_at, used) VALUES ($1, $2, $3, $4, $5)`,
        [user.id, otpCode, 'register', expiresAt, false]
      );
      
      try {
        await sendOtpEmail(email, otpCode, 'Registration OTP');
      } catch (e) {
        console.error('Failed to send OTP email:', e);
      }
      return res.status(201).json({ message: 'User registered. Please verify OTP sent to your email/phone.', user_id: user.id });
    }


    const token = jwt.sign({ user_id: user.id, email: user.email, is_social_media: user.is_social_media || true }, process.env.JWT_SECRET, { expiresIn: '7d' });
    return res.status(201).json({ message: 'User registered via social login.', token });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

  
    const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userResult.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }
    const user = userResult.rows[0];

    
    if (!user.password || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }


    if (!user.is_verified) {
      return res.status(403).json({ message: 'Please verify your account.' });
    }

   
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now
    await pool.query(
      `INSERT INTO user_otps (user_id, otp_code, purpose, expires_at, used) VALUES ($1, $2, $3, $4, $5)`,
      [user.id, otpCode, 'login', expiresAt, false]
    );
   
    try {
      await sendOtpEmail(user.email, otpCode, 'Login OTP');
    } catch (e) {
      console.error('Failed to send OTP email:', e);
    }
    return res.status(200).json({ message: 'OTP sent for login verification.', user_id: user.id });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};


exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required.' });
    const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userResult.rows.length === 0) {
      return res.status(200).json({ message: 'If the email exists, an OTP has been sent.' });
    }
    const user = userResult.rows[0];
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await pool.query(
      'INSERT INTO user_otps (user_id, otp_code, purpose, expires_at, used) VALUES ($1, $2, $3, $4, $5)',
      [user.id, otpCode, 'reset', expiresAt, false]
    );
    try {
      await sendOtpEmail(user.email, otpCode, 'Password Reset OTP');
    } catch (e) {
      console.error('Failed to send OTP email:', e);
    }
    return res.status(200).json({ message: 'If the email exists, an OTP has been sent.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};


exports.resetPassword = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Unauthorized. Missing or invalid token.' });
    }

    const token = authHeader.split(' ')[1];
    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ message: 'Invalid or expired token.' });
    }

    if (payload.purpose !== 'reset') {
      return res.status(401).json({ message: 'Invalid reset token.' });
    }

    const { newPassword } = req.body;
    if (!newPassword) return res.status(400).json({ message: 'New password is required.' });

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password = $1 WHERE id = $2', [hashedPassword, payload.user_id]);

    return res.status(200).json({ message: 'Password reset successful.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};



exports.resendOtp = async (req, res) => {
  try {
    const { email, purpose } = req.body;
    if (!email || !purpose) return res.status(400).json({ message: 'Email and purpose are required.' });
    const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userResult.rows.length === 0) return res.status(404).json({ message: 'User not found.' });
    const user = userResult.rows[0];
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await pool.query(
      'INSERT INTO user_otps (user_id, otp_code, purpose, expires_at, used) VALUES ($1, $2, $3, $4, $5)',
      [user.id, otpCode, purpose, expiresAt, false]
    );
    try {
      await sendOtpEmail(user.email, otpCode, 'OTP Resend');
    } catch (e) {
      console.error('Failed to send OTP email:', e);
    }
    return res.status(200).json({ message: 'OTP resent.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};


exports.logout = async (req, res) => {
  return res.status(200).json({ message: 'Logged out.' });
};


exports.getProfile = async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const userResult = await pool.query('SELECT id, first_name, last_name, email, phone, is_verified, is_social_media, created_at, updated_at FROM users WHERE id = $1', [user_id]);
    if (userResult.rows.length === 0) return res.status(404).json({ message: 'User not found.' });
    return res.status(200).json({ user: userResult.rows[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};


exports.updateProfile = async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const { first_name, last_name, phone } = req.body;
    if (!first_name && !last_name && !phone) return res.status(400).json({ message: 'No fields to update.' });
    let setParts = [];
    let values = [];
    let idx = 1;
    if (first_name) { setParts.push('first_name = $' + idx); values.push(first_name); idx++; }
    if (last_name) { setParts.push('last_name = $' + idx); values.push(last_name); idx++; }
    if (phone) { setParts.push('phone = $' + idx); values.push(phone); idx++; }
    setParts.push('updated_at = NOW()');
    values.push(user_id);
    var setClause = setParts.join(', ');
    var query = 'UPDATE users SET ' + setClause + ' WHERE id = $' + idx + ' RETURNING id, first_name, last_name, email, phone, is_verified, is_social_media, created_at, updated_at';
    const result = await pool.query(query, values);
    return res.status(200).json({ message: 'Profile updated.', user: result.rows[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};
