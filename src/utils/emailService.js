const nodemailer = require('nodemailer');

function createTransporter() {
  const host = process.env.EMAIL_HOST || 'smtp.gmail.com';
  const port = Number(process.env.EMAIL_PORT || 465);
  const secure = String(process.env.EMAIL_SECURE || 'true').toLowerCase() === 'true';

  return nodemailer.createTransport({
    host,
    port,
    secure,
    family: 4,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  });
}

/**
 * Send a 6-digit OTP code to the user's email for password reset.
 */
async function sendOtpEmail(to, otp, firstName = 'Student') {
  const name = firstName || 'Student';

  await createTransporter().sendMail({
    from: `"E-Library NU" <${process.env.EMAIL_USER}>`,
    to,
    subject: `${otp} — Your E-Library NU password reset code`,
    html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Password Reset Code</title>
</head>
<body style="margin:0;padding:0;background:#F8FAFC;font-family:Inter,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F8FAFC;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#20659C,#0d3a61);padding:32px 40px;text-align:center;">
              <span style="color:#ffffff;font-size:22px;font-weight:800;letter-spacing:-0.3px;">
                📚 E-Library <span style="color:#DF900A;">NU</span>
              </span>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px 40px 32px;text-align:center;">
              <h1 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#1A1A1A;">Password Reset Code</h1>
              <p style="margin:0 0 32px;font-size:15px;color:#5E5E5E;line-height:1.6;">
                Hi <strong>${name}</strong>, use the code below to reset your password.
              </p>

              <!-- OTP box -->
              <div style="background:#F0F7FF;border:2px dashed #20659C;border-radius:14px;padding:28px 20px;margin:0 auto 28px;display:inline-block;min-width:220px;">
                <p style="margin:0 0 6px;font-size:12px;font-weight:600;color:#20659C;letter-spacing:2px;text-transform:uppercase;">Your code</p>
                <p style="margin:0;font-size:44px;font-weight:900;letter-spacing:14px;color:#1A1A1A;font-family:monospace;">${otp}</p>
              </div>

              <!-- Expiry notice -->
              <div style="background:#FFF8EC;border:1px solid #F5D98B;border-radius:8px;padding:12px 20px;margin-bottom:24px;">
                <p style="margin:0;font-size:13px;color:#92620A;">
                  ⏰ This code expires in <strong>2 hours</strong>. Do not share it with anyone.
                </p>
              </div>

              <p style="font-size:13px;color:#9CA3AF;margin:0;">
                If you did not request this, please ignore this email — your account is safe.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#F8FAFC;padding:18px 40px;border-top:1px solid #E2E8F0;text-align:center;">
              <p style="margin:0;font-size:12px;color:#9CA3AF;">
                © ${new Date().getFullYear()} Norton University E-Library · Phnom Penh, Cambodia
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
    text: `Hi ${name},\n\nYour E-Library NU password reset code is: ${otp}\n\nIt expires in 2 hours. Do not share it.\n\nIf you did not request this, ignore this email.`,
  });
}

/**
 * Send a forgot-password reset link to the user's email.
 * @param {string} to         - recipient email
 * @param {string} resetLink  - full URL with token e.g. http://localhost:3000/auth/reset-password?token=xxx
 * @param {string} firstName  - user's first name (for personalisation)
 */
async function sendPasswordResetEmail(to, resetLink, firstName = 'Student') {
  const name = firstName || 'Student';

  await createTransporter().sendMail({
    from: `"E-Library NU" <${process.env.EMAIL_USER}>`,
    to,
    subject: 'Reset your E-Library NU password',
    html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Reset Password</title>
</head>
<body style="margin:0;padding:0;background:#F8FAFC;font-family:Inter,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F8FAFC;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#20659C,#0d3a61);padding:36px 40px;text-align:center;">
              <div style="display:inline-flex;align-items:center;gap:10px;">
                <div style="width:40px;height:40px;background:rgba(255,255,255,0.15);border-radius:10px;display:inline-block;line-height:40px;text-align:center;">
                  📚
                </div>
                <span style="color:#ffffff;font-size:22px;font-weight:800;letter-spacing:-0.3px;">
                  E-Library<span style="color:#DF900A;">NU</span>
                </span>
              </div>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px 40px 32px;">
              <h1 style="margin:0 0 8px;font-size:24px;font-weight:800;color:#1A1A1A;">Reset your password</h1>
              <p style="margin:0 0 24px;font-size:15px;color:#5E5E5E;line-height:1.6;">
                Hi <strong>${name}</strong>, we received a request to reset the password for your E-Library NU account.
                Click the button below to choose a new password.
              </p>

              <!-- CTA button -->
              <div style="text-align:center;margin:32px 0;">
                <a href="${resetLink}"
                   style="display:inline-block;background:#20659C;color:#ffffff;font-size:15px;font-weight:700;
                          text-decoration:none;padding:14px 36px;border-radius:10px;letter-spacing:0.2px;">
                  Reset Password
                </a>
              </div>

              <!-- Fallback link -->
              <p style="font-size:13px;color:#9CA3AF;margin:0 0 8px;">Or copy and paste this link in your browser:</p>
              <p style="font-size:12px;color:#20659C;word-break:break-all;margin:0 0 28px;">
                <a href="${resetLink}" style="color:#20659C;">${resetLink}</a>
              </p>

              <!-- Expiry notice -->
              <div style="background:#FFF8EC;border:1px solid #F5D98B;border-radius:8px;padding:12px 16px;margin-bottom:8px;">
                <p style="margin:0;font-size:13px;color:#92620A;">
                  ⏰ This link expires in <strong>1 hour</strong>. If it expires, you can request a new one.
                </p>
              </div>

              <p style="font-size:13px;color:#9CA3AF;margin:16px 0 0;">
                If you did not request a password reset, please ignore this email — your account is safe.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#F8FAFC;padding:20px 40px;border-top:1px solid #E2E8F0;text-align:center;">
              <p style="margin:0;font-size:12px;color:#9CA3AF;">
                © ${new Date().getFullYear()} Norton University E-Library. All rights reserved.<br/>
                Phnom Penh, Cambodia
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
    text: `Hi ${name},\n\nReset your E-Library NU password by visiting:\n${resetLink}\n\nThis link expires in 1 hour.\n\nIf you did not request this, ignore this email.`,
  });
}

module.exports = { sendOtpEmail, sendPasswordResetEmail };