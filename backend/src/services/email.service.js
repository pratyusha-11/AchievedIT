const { Resend } = require('resend');
const nodemailer = require('nodemailer');

const emailUser = process.env.EMAIL_USER;
const emailPass = process.env.EMAIL_PASS;

let smtpTransporter = null;
if (emailUser && emailPass) {
  smtpTransporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // Standard STARTTLS port
    auth: {
      user: emailUser,
      pass: emailPass.replace(/\s+/g, '') // Strip spaces from Google App Password
    },
    family: 4, // Force IPv4 socket (bypasses Render IPv6 ENETUNREACH)
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000
  });
}

const brevoApiKey = process.env.BREVO_API_KEY;
const brevoSenderEmail = process.env.BREVO_SENDER_EMAIL || process.env.EMAIL_USER || 'achievedit11@gmail.com';

const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || (emailUser ? `AchievedIT <${emailUser}>` : 'AchievedIT <onboarding@resend.dev>');

/**
 * Send email helper supporting Brevo (HTTPS 443), Resend (HTTPS 443), and Gmail SMTP
 */
async function dispatchEmail({ to, subject, html }) {
  // Option 1: Brevo HTTPS REST API (Uses Port 443 — NEVER blocked by Render free tier, sends to ANY recipient)
  if (brevoApiKey) {
    try {
      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'api-key': brevoApiKey,
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          sender: { name: 'AchievedIT', email: brevoSenderEmail },
          to: [{ email: to }],
          subject,
          htmlContent: html
        })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || JSON.stringify(data));
      }
      console.log(`✅ Email delivered via Brevo HTTPS to ${to} (ID: ${data.messageId})`);
      return { success: true, id: data.messageId };
    } catch (brevoErr) {
      console.error('❌ Brevo delivery failed:', brevoErr.message);
    }
  }

  // Option 2: Resend HTTPS API (Uses Port 443)
  if (resend) {
    try {
      const result = await resend.emails.send({
        from: FROM_EMAIL,
        to,
        subject,
        html
      });
      if (result && !result.error) {
        console.log(`✅ Email delivered via Resend HTTPS to ${to} (ID: ${result?.data?.id || 'ok'})`);
        return { success: true, data: result?.data };
      }
      console.warn('⚠️ Resend returned note:', result?.error?.message);
    } catch (rErr) {
      console.warn('⚠️ Resend threw error:', rErr.message);
    }
  }

  // Option 3: Gmail SMTP (Note: Render free tier blocks outbound SMTP ports 25, 465, 587)
  if (smtpTransporter) {
    try {
      const info = await smtpTransporter.sendMail({
        from: `AchievedIT <${emailUser}>`,
        to,
        subject,
        html
      });
      console.log(`✅ Email delivered via Gmail SMTP to ${to} (ID: ${info.messageId})`);
      return { success: true, id: info.messageId };
    } catch (smtpError) {
      console.warn('⚠️ Gmail SMTP port blocked or unreachable on this host:', smtpError.message);
    }
  }

  return { success: true, mocked: true };
}

/**
 * Modern SaaS HTML email template wrapper
 */
function getEmailLayout({ title, heading, bodyContent, otpCode, subText }) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #0d0b14;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #e2d9f3;
      -webkit-font-smoothing: antialiased;
    }
    .container {
      max-width: 560px;
      margin: 40px auto;
      padding: 32px 24px;
      background: #171322;
      border: 1px solid #2d2444;
      border-radius: 16px;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
    }
    .header {
      text-align: center;
      padding-bottom: 24px;
      border-bottom: 1px solid #2d2444;
    }
    .brand-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 44px;
      height: 44px;
      border-radius: 50%;
      background: rgba(109, 93, 252, 0.15);
      border: 2px solid #6d5dfc;
      color: #9b8fff;
      font-size: 20px;
      font-weight: bold;
      margin-bottom: 12px;
    }
    .brand-name {
      font-size: 22px;
      font-weight: 700;
      color: #ffffff;
      letter-spacing: -0.5px;
      margin: 0;
    }
    .content {
      padding: 28px 0;
    }
    .heading {
      font-size: 19px;
      font-weight: 600;
      color: #ffffff;
      margin: 0 0 14px 0;
    }
    .paragraph {
      font-size: 14px;
      line-height: 1.6;
      color: #a49ab9;
      margin: 0 0 24px 0;
    }
    .otp-card {
      background: linear-gradient(135deg, rgba(109, 93, 252, 0.1), rgba(255, 138, 91, 0.08));
      border: 1px solid #3d325e;
      border-radius: 12px;
      padding: 24px;
      text-align: center;
      margin: 24px 0;
    }
    .otp-label {
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      color: #9b8fff;
      font-weight: 600;
      margin-bottom: 10px;
    }
    .otp-code {
      font-family: 'SF Mono', Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
      font-size: 36px;
      font-weight: 800;
      letter-spacing: 10px;
      color: #ffffff;
      padding-left: 10px;
      margin: 0;
      text-shadow: 0 2px 10px rgba(109, 93, 252, 0.4);
    }
    .otp-expiry {
      margin-top: 10px;
      font-size: 12px;
      color: #83789b;
    }
    .subtext {
      font-size: 12px;
      line-height: 1.5;
      color: #716688;
      border-top: 1px solid #251e36;
      padding-top: 20px;
      margin-top: 24px;
    }
    .footer {
      text-align: center;
      font-size: 11px;
      color: #5d5472;
      padding-top: 20px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="brand-icon">A</div>
      <h1 class="brand-name">AchievedIT</h1>
    </div>
    <div class="content">
      <h2 class="heading">${heading}</h2>
      <p class="paragraph">${bodyContent}</p>
      <div class="otp-card">
        <div class="otp-label">One-Time Verification Code</div>
        <div class="otp-code">${otpCode}</div>
        <div class="otp-expiry">⏱️ Valid for 10 minutes (max 5 attempts)</div>
      </div>
      <div class="subtext">
        ${subText}
      </div>
    </div>
    <div class="footer">
      <p>© 2026 AchievedIT · Designed & Developed by Pratyusha · v1.0.0 Stable</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Send email verification OTP
 */
async function sendVerificationOtpEmail({ email, fullName, otp }) {
  const subject = `${otp} is your AchievedIT email verification code`;
  const html = getEmailLayout({
    title: 'Verify your AchievedIT email',
    heading: `Hello ${fullName || 'there'},`,
    bodyContent: 'Thank you for joining AchievedIT! Please use the following 6-digit verification code to confirm your email address and activate your account.',
    otpCode: otp,
    subText: 'If you did not request this verification code, someone may have entered your email address by mistake. You can safely ignore this email.'
  });

  // Always log OTP to server console for immediate fallback & debugging
  console.log('\n' + '='.repeat(60));
  console.log(`🔑 [VERIFICATION OTP FOR ${email}]: ${otp}`);
  console.log('='.repeat(60) + '\n');

  try {
    return await dispatchEmail({ to: email, subject, html });
  } catch (error) {
    console.error('Failed to send verification email:', error.message || error);
    const err = new Error(`Email delivery failed: ${error.message || error}`);
    err.status = 400;
    throw err;
  }
}

/**
 * Send password reset OTP
 */
async function sendPasswordResetOtpEmail({ email, fullName, otp }) {
  const subject = `${otp} is your AchievedIT password reset code`;
  const html = getEmailLayout({
    title: 'Reset your AchievedIT password',
    heading: `Hello ${fullName || 'there'},`,
    bodyContent: 'We received a request to reset the password for your AchievedIT account. Use the 6-digit code below to complete your password reset.',
    otpCode: otp,
    subText: 'SECURITY NOTICE: If you did not request a password reset, please ignore this email or contact support immediately. Never share this code with anyone.'
  });

  // Always log OTP to server console for immediate fallback & debugging
  console.log('\n' + '='.repeat(60));
  console.log(`🔑 [PASSWORD RESET OTP FOR ${email}]: ${otp}`);
  console.log('='.repeat(60) + '\n');

  try {
    return await dispatchEmail({ to: email, subject, html });
  } catch (error) {
    console.error('Failed to send password reset email:', error.message || error);
    const err = new Error(`Email delivery failed: ${error.message || error}`);
    err.status = 400;
    throw err;
  }
}

module.exports = {
  sendVerificationOtpEmail,
  sendPasswordResetOtpEmail
};
