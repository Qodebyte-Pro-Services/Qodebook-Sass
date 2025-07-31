const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
  debug: true,
});

async function sendOtpEmail(to, otp, purpose = 'Your OTP') {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject: `${purpose} - Qodebook SaaS`,
    text: `Your OTP is: ${otp}`,
    html: `<p>Your OTP is: <b>${otp}</b></p>`
  };
  return transporter.sendMail(mailOptions);
}

async function sendBusinessCreatedEmail(to, businessName) {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject: `Business Created - Qodebook SaaS`,
    text: `Your business "${businessName}" was created successfully!`,
    html: `<p>Your business <b>${businessName}</b> was created successfully!</p>`
  };
  return transporter.sendMail(mailOptions);
}

module.exports = { sendOtpEmail, sendBusinessCreatedEmail };
