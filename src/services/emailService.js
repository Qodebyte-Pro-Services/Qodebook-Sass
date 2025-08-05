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


async function sendStaffPasswordEmail(to, password, businessName, staffName = null) {
  const subject = `Your Staff Login Credentials - ${businessName}`;
  const greeting = staffName ? `Hello ${staffName},` : 'Hello,';
  
  const message = `
    ${greeting}
    
    Welcome to ${businessName}!
    
    Your staff account has been created successfully.
    
    Your login credentials:
    Email: ${to}
    Password: ${password}
    
    Please change your password after your first login for security.
    
    If you have any questions, please contact your administrator.
    
    Best regards,
    ${businessName} Team
  `;

  const htmlMessage = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Welcome to ${businessName}!</h2>
      <p>${greeting}</p>
      <p>Your staff account has been created successfully.</p>
      
      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <h3 style="margin-top: 0;">Your Login Credentials:</h3>
        <p><strong>Email:</strong> ${to}</p>
        <p><strong>Password:</strong> ${password}</p>
      </div>
      
      <p><strong>Important:</strong> Please change your password after your first login for security.</p>
      
      <p>If you have any questions, please contact your administrator.</p>
      
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

async function sendOwnerPasswordNotification(to, staffName, password, businessName) {
  const subject = `New Staff Password - ${businessName}`;
  
  const message = `
    Hello,
    
    A new staff member has been created for your business "${businessName}".
    
    Staff Details:
    Name: ${staffName}
    Password: ${password}
    
    Please share this password with the staff member securely.
    They should change their password after their first login.
    
    For security reasons, please:
    1. Share this password in person or through a secure channel
    2. Ask the staff member to change their password immediately after login
    3. Delete this email after sharing the password
    
    Best regards,
    Qodebook SaaS Team
  `;

  const htmlMessage = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">New Staff Member Created</h2>
      <p>Hello,</p>
      
      <p>A new staff member has been created for your business <strong>"${businessName}"</strong>.</p>
      
      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <h3 style="margin-top: 0;">Staff Details:</h3>
        <p><strong>Name:</strong> ${staffName}</p>
        <p><strong>Password:</strong> ${password}</p>
      </div>
      
      <p><strong>For security reasons, please:</strong></p>
      <ol>
        <li>Share this password in person or through a secure channel</li>
        <li>Ask the staff member to change their password immediately after login</li>
        <li>Delete this email after sharing the password</li>
      </ol>
      
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

module.exports = { 
  sendOtpEmail, 
  sendBusinessCreatedEmail, 
  sendNotificationEmail,
  sendStaffPasswordEmail,
  sendOwnerPasswordNotification,
  sendPasswordChangeNotification,
  sendPasswordChangeRequestNotification
};
