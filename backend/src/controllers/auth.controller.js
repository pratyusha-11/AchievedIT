const crypto = require('crypto');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const userModel = require('../models/user.model');
const pendingRegistrationModel = require('../models/pendingRegistration.model');
const asyncHandler = require('../utils/asyncHandler');
const { sendVerificationOtpEmail, sendPasswordResetOtpEmail } = require('../services/email.service');

const isProd = process.env.NODE_ENV === 'production';

// Cross-site cookie (Vercel frontend -> Render backend) needs SameSite=None + Secure
// in production. Locally (same-site http) that combination doesn't work, so we
// relax it for development.
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: isProd,
  sameSite: isProd ? 'none' : 'lax',
  maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_REGEX = /^[a-zA-Z0-9_.]{3,30}$/;

/**
 * Validate strong password:
 * - At least 8 characters
 * - At least 1 lowercase letter
 * - At least 1 uppercase letter
 * - At least 1 digit
 * - At least 1 special character
 */
function isStrongPassword(password) {
  if (!password || password.length < 8) return false;
  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasDigit = /\d/.test(password);
  const hasSpecial = /[@$!%*?&#^~_+=<>.-]/.test(password);
  return hasLower && hasUpper && hasDigit && hasSpecial;
}

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function hashOtp(otp) {
  return crypto.createHash('sha256').update(String(otp).trim()).digest('hex');
}

function toPublicUser(user) {
  return {
    id: user._id,
    fullName: user.fullName,
    username: user.username,
    email: user.email,
    isEmailVerified: !!user.isEmailVerified,
    createdAt: user.createdAt
  };
}

function issueSession(res, user) {
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '30d' });
  res.cookie('token', token, COOKIE_OPTIONS);
  return token;
}

// -----------------------------------------------------------------------------
// REGISTER USER
// -----------------------------------------------------------------------------
const registerUser = asyncHandler(async (req, res) => {
  const fullName = req.body.fullName?.trim();
  const username = req.body.username?.trim().toLowerCase();
  const email = req.body.email?.trim().toLowerCase();
  const password = req.body.password;
  const confirmPassword = req.body.confirmPassword;

  if (!fullName || !username || !email || !password || !confirmPassword) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  if (!USERNAME_REGEX.test(username)) {
    return res.status(400).json({
      message: 'Username must be 3-30 characters and contain only letters, numbers, underscores, or dots.'
    });
  }

  if (!EMAIL_REGEX.test(email)) {
    return res.status(400).json({ message: 'Please enter a valid email address.' });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({ message: 'Passwords do not match.' });
  }

  if (!isStrongPassword(password)) {
    return res.status(400).json({
      message: 'Password must be at least 8 characters and include uppercase, lowercase, a number, and a special character.'
    });
  }

  // Check if username is already taken by an active user
  const existingUsernameUser = await userModel.findOne({ username });
  if (existingUsernameUser) {
    return res.status(409).json({ message: 'This username is already taken. Please choose another.' });
  }

  // Check if email is already registered by an active user
  const existingEmailUser = await userModel.findOne({ email });
  if (existingEmailUser) {
    return res.status(409).json({ message: 'An account with this email already exists. Try logging in instead.' });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const otp = generateOtp();
  const codeHash = hashOtp(otp);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  // Upsert pending registration (clears any previous unverified attempt for this email/username)
  await pendingRegistrationModel.deleteMany({ $or: [{ email }, { username }] });

  await pendingRegistrationModel.create({
    fullName,
    username,
    email,
    passwordHash,
    codeHash,
    expiresAt,
    attempts: 0,
    lastSentAt: new Date()
  });

  // Send verification email (via Gmail SMTP or Resend)
  await sendVerificationOtpEmail({ email, fullName, otp });

  res.status(201).json({
    message: 'Verification code sent to your email. Please verify to activate your account.',
    email,
    requireVerification: true
  });
});

// -----------------------------------------------------------------------------
// VERIFY EMAIL OTP
// -----------------------------------------------------------------------------
const verifyEmailOtp = asyncHandler(async (req, res) => {
  const email = req.body.email?.trim().toLowerCase();
  const otp = req.body.otp?.trim();

  if (!email || !otp) {
    return res.status(400).json({ message: 'Email and verification code are required.' });
  }

  // 1. Check pending registration first
  const pending = await pendingRegistrationModel.findOne({ email });
  if (pending) {
    if (pending.attempts >= 5) {
      return res.status(429).json({
        message: 'Too many incorrect attempts. Please request a new verification code.'
      });
    }

    if (new Date() > new Date(pending.expiresAt)) {
      return res.status(400).json({
        message: 'Verification code has expired. Please request a new code.'
      });
    }

    const inputHash = hashOtp(otp);
    if (inputHash !== pending.codeHash) {
      pending.attempts = (pending.attempts || 0) + 1;
      await pending.save();
      const remaining = 5 - pending.attempts;
      return res.status(400).json({
        message: `Invalid verification code. ${remaining > 0 ? `${remaining} attempt(s) remaining.` : 'Please request a new code.'}`
      });
    }

    // OTP Verified! NOW create the official user in database
    const user = await userModel.create({
      fullName: pending.fullName,
      username: pending.username,
      email: pending.email,
      passwordHash: pending.passwordHash,
      isEmailVerified: true
    });

    // Clean up pending registration
    await pendingRegistrationModel.deleteOne({ _id: pending._id });

    const token = issueSession(res, user);
    return res.status(200).json({
      message: 'Email verified successfully! Welcome to AchievedIT.',
      user: toPublicUser(user),
      token
    });
  }

  // 2. Fallback check for already registered users
  const user = await userModel.findOne({ email });
  if (!user) {
    return res.status(404).json({ message: 'No registration request found for this email. Please sign up first.' });
  }

  if (user.isEmailVerified) {
    const token = issueSession(res, user);
    return res.status(200).json({
      message: 'Account is already verified.',
      user: toPublicUser(user),
      token
    });
  }

  const otpData = user.emailVerificationOtp;
  if (!otpData || !otpData.codeHash) {
    return res.status(400).json({ message: 'No active verification code found. Please request a new code.' });
  }

  if (otpData.attempts >= 5) {
    return res.status(429).json({
      message: 'Too many incorrect attempts. Please request a new verification code.'
    });
  }

  if (new Date() > new Date(otpData.expiresAt)) {
    return res.status(400).json({
      message: 'Verification code has expired. Please request a new code.'
    });
  }

  const inputHash = hashOtp(otp);
  if (inputHash !== otpData.codeHash) {
    user.emailVerificationOtp.attempts = (otpData.attempts || 0) + 1;
    await user.save();
    const remaining = 5 - user.emailVerificationOtp.attempts;
    return res.status(400).json({
      message: `Invalid verification code. ${remaining > 0 ? `${remaining} attempt(s) remaining.` : 'Please request a new code.'}`
    });
  }

  // Legacy user verification successful
  user.isEmailVerified = true;
  user.emailVerificationOtp = { codeHash: null, expiresAt: null, attempts: 0, lastSentAt: null };
  await user.save();

  const token = issueSession(res, user);
  res.status(200).json({
    message: 'Email verified successfully! Welcome to AchievedIT.',
    user: toPublicUser(user),
    token
  });
});

// -----------------------------------------------------------------------------
// RESEND VERIFICATION OTP
// -----------------------------------------------------------------------------
const resendVerificationOtp = asyncHandler(async (req, res) => {
  const email = req.body.email?.trim().toLowerCase();
  if (!email) {
    return res.status(400).json({ message: 'Email is required.' });
  }

  // 1. Check pending registration
  const pending = await pendingRegistrationModel.findOne({ email });
  if (pending) {
    const lastSent = pending.lastSentAt;
    if (lastSent && Date.now() - new Date(lastSent).getTime() < 60000) {
      const secondsLeft = Math.ceil((60000 - (Date.now() - new Date(lastSent).getTime())) / 1000);
      return res.status(429).json({ message: `Please wait ${secondsLeft}s before requesting a new code.` });
    }

    const otp = generateOtp();
    pending.codeHash = hashOtp(otp);
    pending.expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    pending.attempts = 0;
    pending.lastSentAt = new Date();
    await pending.save();

    await sendVerificationOtpEmail({ email: pending.email, fullName: pending.fullName, otp });
    return res.status(200).json({ message: 'A new verification code has been sent to your email.' });
  }

  // 2. Fallback check for userModel
  const user = await userModel.findOne({ email });
  if (!user) {
    return res.status(404).json({ message: 'No registration found with this email. Please sign up.' });
  }

  if (user.isEmailVerified) {
    return res.status(400).json({ message: 'This email is already verified. Please log in.' });
  }

  // Rate limit: 60s cooldown
  const lastSent = user.emailVerificationOtp?.lastSentAt;
  if (lastSent && Date.now() - new Date(lastSent).getTime() < 60000) {
    const secondsLeft = Math.ceil((60000 - (Date.now() - new Date(lastSent).getTime())) / 1000);
    return res.status(429).json({ message: `Please wait ${secondsLeft}s before requesting a new code.` });
  }

  const otp = generateOtp();
  user.emailVerificationOtp = {
    codeHash: hashOtp(otp),
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    attempts: 0,
    lastSentAt: new Date()
  };
  await user.save();

  await sendVerificationOtpEmail({ email: user.email, fullName: user.fullName, otp });

  res.status(200).json({ message: 'A new verification code has been sent to your email.' });
});

// -----------------------------------------------------------------------------
// LOGIN USER
// -----------------------------------------------------------------------------
const loginUser = asyncHandler(async (req, res) => {
  const identifier = req.body.email?.trim().toLowerCase();
  const password = req.body.password;

  if (!identifier || !password) {
    return res.status(400).json({ message: 'Email/username and password are required.' });
  }

  // Allow logging in with either email or username
  const user = await userModel.findOne({
    $or: [{ email: identifier }, { username: identifier }]
  });

  if (!user) {
    const pending = await pendingRegistrationModel.findOne({
      $or: [{ email: identifier }, { username: identifier }]
    });
    if (pending) {
      const isPasswordValid = await bcrypt.compare(password, pending.passwordHash);
      if (isPasswordValid) {
        return res.status(403).json({
          message: 'Your registration is not verified yet. Please enter the verification code sent to your email.',
          requireVerification: true,
          email: pending.email
        });
      }
    }
    return res.status(401).json({ message: 'Invalid credentials.' });
  }

  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
  if (!isPasswordValid) {
    return res.status(401).json({ message: 'Invalid credentials.' });
  }

  // Check email verification
  if (!user.isEmailVerified) {
    // Generate and send a fresh OTP if needed
    const lastSent = user.emailVerificationOtp?.lastSentAt;
    const canSend = !lastSent || Date.now() - new Date(lastSent).getTime() > 60000;
    if (canSend) {
      const otp = generateOtp();
      user.emailVerificationOtp = {
        codeHash: hashOtp(otp),
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        attempts: 0,
        lastSentAt: new Date()
      };
      await user.save();
      await sendVerificationOtpEmail({ email: user.email, fullName: user.fullName, otp });
    }

    return res.status(403).json({
      message: 'Please verify your email address to log in. A verification code has been sent.',
      requireVerification: true,
      email: user.email
    });
  }

  const token = issueSession(res, user);
  res.status(200).json({
    message: 'Logged in successfully',
    user: toPublicUser(user),
    token
  });
});

// -----------------------------------------------------------------------------
// FORGOT PASSWORD
// -----------------------------------------------------------------------------
const forgotPassword = asyncHandler(async (req, res) => {
  const email = req.body.email?.trim().toLowerCase();
  if (!email || !EMAIL_REGEX.test(email)) {
    return res.status(400).json({ message: 'Please enter a valid email address.' });
  }

  const user = await userModel.findOne({ email });
  // Prevent user enumeration by returning a standard message
  if (!user) {
    return res.status(200).json({
      message: 'If an account exists with this email, a reset code has been sent.',
      email
    });
  }

  // Rate limit: 60s cooldown
  const lastSent = user.passwordResetOtp?.lastSentAt;
  if (lastSent && Date.now() - new Date(lastSent).getTime() < 60000) {
    const secondsLeft = Math.ceil((60000 - (Date.now() - new Date(lastSent).getTime())) / 1000);
    return res.status(429).json({ message: `Please wait ${secondsLeft}s before requesting another reset code.` });
  }

  const otp = generateOtp();
  user.passwordResetOtp = {
    codeHash: hashOtp(otp),
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    attempts: 0,
    lastSentAt: new Date()
  };
  await user.save();

  await sendPasswordResetOtpEmail({ email: user.email, fullName: user.fullName, otp });

  res.status(200).json({
    message: 'Password reset code has been sent to your email.',
    email
  });
});

// -----------------------------------------------------------------------------
// VERIFY RESET OTP
// -----------------------------------------------------------------------------
const verifyResetOtp = asyncHandler(async (req, res) => {
  const email = req.body.email?.trim().toLowerCase();
  const otp = req.body.otp?.trim();

  if (!email || !otp) {
    return res.status(400).json({ message: 'Email and reset code are required.' });
  }

  const user = await userModel.findOne({ email });
  if (!user || !user.passwordResetOtp?.codeHash) {
    return res.status(400).json({ message: 'Invalid or expired reset code.' });
  }

  const otpData = user.passwordResetOtp;
  if (otpData.attempts >= 5) {
    return res.status(429).json({ message: 'Too many incorrect attempts. Please request a new reset code.' });
  }

  if (new Date() > new Date(otpData.expiresAt)) {
    return res.status(400).json({ message: 'Reset code has expired. Please request a new code.' });
  }

  const inputHash = hashOtp(otp);
  if (inputHash !== otpData.codeHash) {
    user.passwordResetOtp.attempts = (otpData.attempts || 0) + 1;
    await user.save();
    const remaining = 5 - user.passwordResetOtp.attempts;
    return res.status(400).json({
      message: `Invalid reset code. ${remaining > 0 ? `${remaining} attempt(s) remaining.` : 'Please request a new code.'}`
    });
  }

  res.status(200).json({ message: 'Reset code verified successfully. You may now set your new password.' });
});

// -----------------------------------------------------------------------------
// RESET PASSWORD
// -----------------------------------------------------------------------------
const resetPassword = asyncHandler(async (req, res) => {
  const email = req.body.email?.trim().toLowerCase();
  const otp = req.body.otp?.trim();
  const newPassword = req.body.newPassword;
  const confirmPassword = req.body.confirmPassword;

  if (!email || !otp || !newPassword || !confirmPassword) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  if (newPassword !== confirmPassword) {
    return res.status(400).json({ message: 'Passwords do not match.' });
  }

  if (!isStrongPassword(newPassword)) {
    return res.status(400).json({
      message: 'Password must be at least 8 characters and include uppercase, lowercase, a number, and a special character.'
    });
  }

  const user = await userModel.findOne({ email });
  if (!user || !user.passwordResetOtp?.codeHash) {
    return res.status(400).json({ message: 'Invalid or expired reset session. Please start over.' });
  }

  const otpData = user.passwordResetOtp;
  if (otpData.attempts >= 5 || new Date() > new Date(otpData.expiresAt)) {
    return res.status(400).json({ message: 'Reset code has expired or exceeded maximum attempts. Please request a new code.' });
  }

  const inputHash = hashOtp(otp);
  if (inputHash !== otpData.codeHash) {
    return res.status(400).json({ message: 'Invalid reset code.' });
  }

  // Hash new password and clear reset OTP
  user.passwordHash = await bcrypt.hash(newPassword, 10);
  user.passwordResetOtp = { codeHash: null, expiresAt: null, attempts: 0, lastSentAt: null };
  await user.save();

  res.status(200).json({ message: 'Password has been reset successfully. You can now log in with your new password.' });
});

// -----------------------------------------------------------------------------
// CHANGE PASSWORD (AUTHENTICATED)
// -----------------------------------------------------------------------------
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;

  if (!currentPassword || !newPassword || !confirmPassword) {
    return res.status(400).json({ message: 'All password fields are required.' });
  }

  if (newPassword !== confirmPassword) {
    return res.status(400).json({ message: 'New passwords do not match.' });
  }

  if (currentPassword === newPassword) {
    return res.status(400).json({ message: 'New password cannot be the same as your current password.' });
  }

  if (!isStrongPassword(newPassword)) {
    return res.status(400).json({
      message: 'New password must be at least 8 characters and include uppercase, lowercase, a number, and a special character.'
    });
  }

  const user = await userModel.findById(req.userId);
  if (!user) {
    return res.status(404).json({ message: 'User not found.' });
  }

  const isCurrentValid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!isCurrentValid) {
    return res.status(400).json({ message: 'Current password is incorrect.' });
  }

  user.passwordHash = await bcrypt.hash(newPassword, 10);
  await user.save();

  res.status(200).json({ message: 'Password updated successfully.' });
});

// -----------------------------------------------------------------------------
// GET CURRENT USER
// -----------------------------------------------------------------------------
const getCurrentUser = asyncHandler(async (req, res) => {
  const user = await userModel.findById(req.userId);
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.status(200).json({ user: toPublicUser(user) });
});

// -----------------------------------------------------------------------------
// LOGOUT
// -----------------------------------------------------------------------------
const logoutUser = asyncHandler(async (req, res) => {
  res.clearCookie('token', COOKIE_OPTIONS);
  res.status(200).json({ message: 'Logged out' });
});

module.exports = {
  registerUser,
  verifyEmailOtp,
  resendVerificationOtp,
  loginUser,
  forgotPassword,
  verifyResetOtp,
  resetPassword,
  changePassword,
  getCurrentUser,
  logoutUser
};
