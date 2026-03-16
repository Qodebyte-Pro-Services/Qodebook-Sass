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



function emailWrapper(bodyContent) {
  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>QodeBook</title>
    <!--[if mso]>
    <style>
      table, td, div, p, span { font-family: Arial, sans-serif !important; }
    </style>
    <![endif]-->
  </head>
  <body style="margin:0;padding:0;background-color:#f0f2f5;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;-webkit-font-smoothing:antialiased;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0f2f5;padding:40px 20px;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

            <!-- Logo Header -->
            <tr>
              <td align="center" style="padding-bottom:24px;">
                <table role="presentation" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:12px 28px;border-radius:12px;">
                      <span style="font-size:26px;font-weight:800;color:#ffffff;letter-spacing:1px;text-decoration:none;">
                        Qode<span style="color:#c4b5fd;">Book</span>
                      </span>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Gradient Accent Bar -->
            <tr>
              <td style="height:4px;background:linear-gradient(90deg,#6366f1,#8b5cf6,#a78bfa);border-radius:4px 4px 0 0;"></td>
            </tr>

            <!-- Main Card -->
            <tr>
              <td style="background-color:#ffffff;padding:40px 36px 32px;border-radius:0 0 16px 16px;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
                ${bodyContent}
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="padding:28px 0 0;" align="center">
                <table role="presentation" cellpadding="0" cellspacing="0">
                  <tr>
                    <td align="center" style="padding-bottom:8px;">
                      <span style="font-size:11px;color:#9ca3af;letter-spacing:0.5px;">Powered by</span>
                    </td>
                  </tr>
                  <tr>
                    <td align="center">
                      <span style="font-size:15px;font-weight:700;background:linear-gradient(135deg,#6366f1,#8b5cf6);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;letter-spacing:0.5px;">
                        PrimeLabs
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td align="center" style="padding-top:12px;">
                      <span style="font-size:11px;color:#b0b7c3;">
                        &copy; ${new Date().getFullYear()} QodeBook &middot; All rights reserved.
                      </span>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>`;
}

// ─── Helper: styled info-box used for credentials, OTPs, etc. ───────────────

function infoBox(content, variant = 'default') {
  const themes = {
    default: { bg: '#f5f3ff', border: '#e0e7ff', accent: '#6366f1' },
    warning: { bg: '#fffbeb', border: '#fde68a', accent: '#f59e0b' },
    info:    { bg: '#eff6ff', border: '#bfdbfe', accent: '#3b82f6' },
    success: { bg: '#ecfdf5', border: '#a7f3d0', accent: '#10b981' },
  };
  const t = themes[variant] || themes.default;
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;">
      <tr>
        <td style="background-color:${t.bg};border:1px solid ${t.border};border-left:4px solid ${t.accent};padding:20px 24px;border-radius:8px;">
          ${content}
        </td>
      </tr>
    </table>`;
}

function primaryButton(label, url) {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;">
      <tr>
        <td style="background:linear-gradient(135deg,#6366f1,#8b5cf6);border-radius:8px;padding:14px 32px;">
          <a href="${url}" target="_blank" style="color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;letter-spacing:0.3px;">${label}</a>
        </td>
      </tr>
    </table>`;
}



async function sendOtpEmail(to, otp, purpose = 'Your OTP') {
  const body = `
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#1e1b4b;">Verification Code</h1>
    <p style="margin:0 0 24px;font-size:14px;color:#6b7280;">${purpose}</p>
    <p style="font-size:15px;color:#374151;line-height:1.6;">
      Use the code below to complete your verification. This code will expire shortly.
    </p>
    ${infoBox(`
      <p style="margin:0;font-size:13px;color:#6b7280;font-weight:500;">Your OTP Code</p>
      <p style="margin:8px 0 0;font-size:32px;font-weight:800;color:#6366f1;letter-spacing:6px;">${otp}</p>
    `)}
    <p style="font-size:13px;color:#9ca3af;margin-top:20px;">If you did not request this code, please ignore this email.</p>
  `;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject: `${purpose} - QodeBook`,
    text: `Your OTP is: ${otp}`,
    html: emailWrapper(body),
  };
  return transporter.sendMail(mailOptions);
}

async function sendBusinessCreatedEmail(to, businessName) {
  const body = `
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#1e1b4b;">🎉 Business Created!</h1>
    <p style="margin:0 0 24px;font-size:14px;color:#6b7280;">Congratulations — you're all set.</p>
    <p style="font-size:15px;color:#374151;line-height:1.6;">
      Your business has been successfully created and is ready to go.
    </p>
    ${infoBox(`
      <p style="margin:0;font-size:13px;color:#6b7280;font-weight:500;">Business Name</p>
      <p style="margin:8px 0 0;font-size:20px;font-weight:700;color:#6366f1;">${businessName}</p>
    `, 'success')}
    <p style="font-size:15px;color:#374151;line-height:1.6;">
      You can now start managing your team, products, and more from your dashboard.
    </p>
  `;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject: `Business Created - QodeBook`,
    text: `Your business "${businessName}" was created successfully!`,
    html: emailWrapper(body),
  };
  return transporter.sendMail(mailOptions);
}

async function sendNotificationEmail(to, subject, message) {
  const body = `
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#1e1b4b;">Notification</h1>
    <p style="margin:0 0 24px;font-size:14px;color:#6b7280;">${subject}</p>
    ${infoBox(`
      <p style="margin:0;font-size:15px;color:#374151;line-height:1.7;">${message}</p>
    `, 'info')}
  `;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject,
    text: message,
    html: emailWrapper(body),
  };
  return transporter.sendMail(mailOptions);
}

async function sendStaffPasswordEmail(to, password, businessName, staffName = null, loginUrl) {
  const subject = `Your Staff Login Credentials - ${businessName}`;
  const greeting = staffName ? `Hello ${staffName},` : 'Hello,';

  const body = `
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#1e1b4b;">Welcome Aboard! 🚀</h1>
    <p style="margin:0 0 24px;font-size:14px;color:#6b7280;">${greeting}</p>
    <p style="font-size:15px;color:#374151;line-height:1.6;">
      Your staff account for <strong style="color:#6366f1;">${businessName}</strong> has been created. Below are your login credentials.
    </p>
    ${infoBox(`
      <p style="margin:0 0 12px;font-size:14px;font-weight:600;color:#1e1b4b;">Login Details</p>
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td style="padding:6px 0;font-size:13px;color:#6b7280;width:90px;">Email</td>
          <td style="padding:6px 0;font-size:14px;color:#1e1b4b;font-weight:600;">${to}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;font-size:13px;color:#6b7280;">Password</td>
          <td style="padding:6px 0;font-size:14px;color:#1e1b4b;font-weight:600;font-family:monospace;letter-spacing:1px;">${password}</td>
        </tr>
      </table>
    `)}
    ${primaryButton('Login to Your Account', loginUrl)}
    ${infoBox(`
      <p style="margin:0;font-size:13px;color:#92400e;">
        <strong>⚠️ Important:</strong> Please change your password after your first login for security.
      </p>
    `, 'warning')}
    <p style="font-size:14px;color:#6b7280;margin-top:24px;">
      Best regards,<br/><strong style="color:#374151;">${businessName} Team</strong>
    </p>
  `;

  return transporter.sendMail({
    from: process.env.EMAIL_USER,
    to,
    subject,
    html: emailWrapper(body),
  });
}

async function sendOwnerPasswordNotification(to, staffName, password, businessName, loginUrl) {
  const subject = `New Staff Password - ${businessName}`;

  const body = `
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#1e1b4b;">New Staff Created</h1>
    <p style="margin:0 0 24px;font-size:14px;color:#6b7280;">A new team member has joined ${businessName}.</p>
    <p style="font-size:15px;color:#374151;line-height:1.6;">
      Hello, a new staff member has been added to your business <strong style="color:#6366f1;">${businessName}</strong>.
    </p>
    ${infoBox(`
      <p style="margin:0 0 12px;font-size:14px;font-weight:600;color:#1e1b4b;">Staff Credentials</p>
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td style="padding:6px 0;font-size:13px;color:#6b7280;width:100px;">Staff Name</td>
          <td style="padding:6px 0;font-size:14px;color:#1e1b4b;font-weight:600;">${staffName}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;font-size:13px;color:#6b7280;">Password</td>
          <td style="padding:6px 0;font-size:14px;color:#1e1b4b;font-weight:600;font-family:monospace;letter-spacing:1px;">${password}</td>
        </tr>
      </table>
    `)}
    ${primaryButton('Go to Dashboard', loginUrl)}
    ${infoBox(`
      <p style="margin:0;font-size:13px;color:#92400e;">
        <strong>⚠️ Security Tip:</strong> Share these credentials securely and ask the staff member to change their password after their first login.
      </p>
    `, 'warning')}
    <p style="font-size:14px;color:#6b7280;margin-top:24px;">
      Best regards,<br/><strong style="color:#374151;">QodeBook Team</strong>
    </p>
  `;

  return transporter.sendMail({
    from: process.env.EMAIL_USER,
    to,
    subject,
    html: emailWrapper(body),
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

  const body = `
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#1e1b4b;">Password Changed ✅</h1>
    <p style="margin:0 0 24px;font-size:14px;color:#6b7280;">${greeting}</p>
    <p style="font-size:15px;color:#374151;line-height:1.6;">
      Your password for <strong style="color:#6366f1;">${businessName}</strong> has been changed successfully.
    </p>
    ${infoBox(`
      <p style="margin:0;font-size:13px;color:#92400e;">
        <strong>🔒 Security Notice:</strong> If you did not request this change, please contact your administrator immediately.
      </p>
    `, 'warning')}
    <p style="font-size:14px;color:#6b7280;margin-top:24px;">
      Best regards,<br/><strong style="color:#374151;">${businessName} Team</strong>
    </p>
  `;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject,
    text: message,
    html: emailWrapper(body),
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
    QodeBook Team
  `;

  const body = `
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#1e1b4b;">Password Change Request</h1>
    <p style="margin:0 0 24px;font-size:14px;color:#6b7280;">Action required for ${businessName}</p>
    <p style="font-size:15px;color:#374151;line-height:1.6;">
      Hello, a password change request has been submitted for staff member
      <strong style="color:#6366f1;">${staffName}</strong> in your business
      <strong style="color:#6366f1;">"${businessName}"</strong>.
    </p>
    ${infoBox(`
      <p style="margin:0;font-size:14px;color:#1e40af;">
        <strong>📋 Action Required:</strong> Please review and approve or reject this request in your admin panel.
      </p>
    `, 'info')}
    <p style="font-size:14px;color:#6b7280;margin-top:24px;">
      Best regards,<br/><strong style="color:#374151;">QodeBook Team</strong>
    </p>
  `;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject,
    text: message,
    html: emailWrapper(body),
  };

  return transporter.sendMail(mailOptions);
}

async function sendStaffOtpEmail(to, otp, staffName = null) {
  const displayName = staffName || 'Staff Member';
  const subject = `Your OTP Code - ${displayName}`;

  const message = `
    Hello ${displayName},
    Your OTP code is: ${otp}
    Please use this code to complete your verification.
    Best regards,
    QodeBook Team
  `;

  const body = `
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#1e1b4b;">Verification Code</h1>
    <p style="margin:0 0 24px;font-size:14px;color:#6b7280;">Hello ${displayName},</p>
    <p style="font-size:15px;color:#374151;line-height:1.6;">
      Use the code below to complete your verification. This code will expire shortly.
    </p>
    ${infoBox(`
      <p style="margin:0;font-size:13px;color:#6b7280;font-weight:500;">Your OTP Code</p>
      <p style="margin:8px 0 0;font-size:32px;font-weight:800;color:#6366f1;letter-spacing:6px;">${otp}</p>
    `)}
    <p style="font-size:13px;color:#9ca3af;margin-top:20px;">If you did not request this code, please ignore this email.</p>
    <p style="font-size:14px;color:#6b7280;margin-top:24px;">
      Best regards,<br/><strong style="color:#374151;">QodeBook Team</strong>
    </p>
  `;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject,
    text: message,
    html: emailWrapper(body),
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
    QodeBook Team
  `;

  const body = `
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#1e1b4b;">Staff OTP Requested</h1>
    <p style="margin:0 0 24px;font-size:14px;color:#6b7280;">New verification request for ${businessName}</p>
    <p style="font-size:15px;color:#374151;line-height:1.6;">
      Hello, a staff member has requested an OTP for your business
      <strong style="color:#6366f1;">"${businessName}"</strong>.
    </p>
    ${infoBox(`
      <p style="margin:0;font-size:13px;color:#6b7280;font-weight:500;">Staff OTP Code</p>
      <p style="margin:8px 0 0;font-size:32px;font-weight:800;color:#6366f1;letter-spacing:6px;">${otp}</p>
    `)}
    ${infoBox(`
      <p style="margin:0;font-size:13px;color:#92400e;">
        <strong>🔐 Security:</strong> Please share this OTP with the staff member through a secure channel only.
      </p>
    `, 'warning')}
    <p style="font-size:14px;color:#6b7280;margin-top:24px;">
      Best regards,<br/><strong style="color:#374151;">QodeBook Team</strong>
    </p>
  `;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject,
    text: message,
    html: emailWrapper(body),
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
  sendOwnerOtpNotification,
};
