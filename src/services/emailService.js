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

async function sendNotificationEmail(to, subject, message) {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject,
    text: message,
    html: `<p>${message}</p>`
  };
  return transporter.sendMail(mailOptions);
}


async function sendStaffPasswordEmail(to, password, businessName, staffName = null, loginUrl) {
  const subject = `Your Staff Login Credentials - ${businessName}`;
  const greeting = staffName ? `Hello ${staffName},` : 'Hello,';

  const htmlMessage = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Welcome to ${businessName}!</h2>
      <p>${greeting}</p>
      <p>Your staff account has been created successfully.</p>
      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px;">
        <h3>Your Login Details:</h3>
        <p><strong>Email:</strong> ${to}</p>
        <p><strong>Password:</strong> ${password}</p>
        <p><strong>Login URL:</strong> <a href="${loginUrl}" target="_blank">${loginUrl}</a></p>
      </div>
      <p><strong>Important:</strong> Change your password after your first login for security.</p>
      <p>Best regards,<br>${businessName} Team</p>
    </div>
  `;

  return transporter.sendMail({
    from: process.env.EMAIL_USER,
    to,
    subject,
    html: htmlMessage
  });
}

  async function sendOwnerPasswordNotification(to, staffName, password, businessName, loginUrl) {
  const subject = `New Staff Password - ${businessName}`;

  const htmlMessage = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>New Staff Created</h2>
      <p>Hello,</p>
      <p>A new staff member has been created for your business <strong>${businessName}</strong>.</p>
      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px;">
        <p><strong>Staff Name:</strong> ${staffName}</p>
        <p><strong>Password:</strong> ${password}</p>
        <p><strong>Login URL:</strong> <a href="${loginUrl}" target="_blank">${loginUrl}</a></p>
      </div>
      <p>Share these credentials securely and ask the staff to change their password after first login.</p>
      <p>Best regards,<br>Qodebook SaaS Team</p>
    </div>
  `;

  return transporter.sendMail({
    from: process.env.EMAIL_USER,
    to,
    subject,
    html: htmlMessage
  });
}

async function sendPasswordChangeNotification(to, businessName, staffName = null) {
  const subject = `Password Changed - ${businessName}`;
  const greeting = staffName ? `Hello ${staffName},` : 'Hello,';
  
  const message = `
    ${greeting}
    
    Your password for ${businessName} has been changed successfully.
    
    If you did not request this change, please contact your administrator immediately.
    
    Best regards,
    ${businessName} Team
  `;

  const htmlMessage = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Password Changed Successfully</h2>
      <p>${greeting}</p>
      
      <p>Your password for <strong>${businessName}</strong> has been changed successfully.</p>
      
      <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p style="margin: 0;"><strong>Security Notice:</strong> If you did not request this change, please contact your administrator immediately.</p>
      </div>
      
      <hr style="margin: 30px 0;">
      <p style="color: #666; font-size: 14px;">
        Best regards,<br>
        ${businessName} Team
      </p>
    </div>
  `;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject,
    text: message,
    html: htmlMessage
  };
  
  return transporter.sendMail(mailOptions);
}

async function sendPasswordChangeRequestNotification(to, staffName, businessName) {
  const subject = `Password Change Request - ${businessName}`;
  
  const message = `
    Hello,
    
    A password change request has been submitted for staff member ${staffName} in your business "${businessName}".
    
    Please review and approve/reject this request in your admin panel.
    
    Best regards,
    Qodebook SaaS Team
  `;

  const htmlMessage = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Password Change Request</h2>
      <p>Hello,</p>
      
      <p>A password change request has been submitted for staff member <strong>${staffName}</strong> in your business <strong>"${businessName}"</strong>.</p>
      
      <div style="background-color: #e3f2fd; border: 1px solid #bbdefb; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p style="margin: 0;">Please review and approve/reject this request in your admin panel.</p>
      </div>
      
      <hr style="margin: 30px 0;">
      <p style="color: #666; font-size: 14px;">
        Best regards,<br>
        Qodebook SaaS Team
      </p>
    </div>
  `;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject,
    text: message,
    html: htmlMessage
  };
  
  return transporter.sendMail(mailOptions);
}

async function sendStaffOtpEmail(to, otp, staffName = null) {
  const subject = `Your OTP Code - ${staffName ? staffName : 'Staff Member'}`;
  const message = `
    Hello ${staffName ? staffName : 'Staff Member'},
    
    Your OTP code is: ${otp}
    
    Please use this code to complete your verification.
    
    Best regards,
    Qodebook SaaS Team
  `;

  const htmlMessage = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Your OTP Code</h2>
      <p>Hello ${staffName ? staffName : 'Staff Member'},</p>
      
      <p>Your OTP code is: <strong>${otp}</strong></p>
      
      <p>Please use this code to complete your verification.</p>
      
      <hr style="margin: 30px 0;">
      <p style="color: #666; font-size: 14px;">
        Best regards,<br>
        Qodebook SaaS Team
      </p>
    </div>
  `;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject,
    text: message,
    html: htmlMessage
  };
  
  return transporter.sendMail(mailOptions);
}


async function sendOwnerOtpNotification(to, otp, businessName) {
  const subject = `New Staff OTP - ${businessName}`;
  
  const message = `
    Hello,
    A new staff member has requested an OTP for your business "${businessName}".
    Staff OTP: ${otp}
    Please share this OTP with the staff member securely.
    Best regards,
    Qodebook SaaS Team
  `;
  const htmlMessage = ` 
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">New Staff OTP Requested</h2>
      <p>Hello,</p>
      <p>A new staff member has requested an OTP for your business <strong>"${businessName}"</strong>.</p>
      <p>Staff OTP: <strong>${otp}</strong></p>
      <p>Please share this OTP with the staff member securely.</p>
      <hr style="margin: 30px 0;">
      <p style="color: #666; font-size: 14px;">
        Best regards,<br>
        Qodebook SaaS Team
      </p>
    </div>
  `;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject,
    text: message,
    html: htmlMessage
  };

  return transporter.sendMail(mailOptions);
}

module.exports = { 
  sendOtpEmail, 
  sendBusinessCreatedEmail, 
  sendNotificationEmail,
  sendStaffPasswordEmail,
  sendOwnerPasswordNotification,
  sendPasswordChangeNotification,
  sendPasswordChangeRequestNotification,
  sendStaffOtpEmail,
  sendOwnerOtpNotification
};
