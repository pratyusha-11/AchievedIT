const express = require('express');
const rateLimit = require('express-rate-limit');
const authController = require('../controllers/auth.controller');
const { authUser } = require('../middleware/auth.middleware');

const router = express.Router();

// Rate limiter for login/signup/reset actions
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 25,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many attempts — please try again in a few minutes.' }
});

// Tighter limiter for OTP verification & resend
const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many OTP requests — please slow down and try again later.' }
});

router.post('/register', authLimiter, authController.registerUser);
router.post('/verify-otp', otpLimiter, authController.verifyEmailOtp);
router.post('/resend-otp', otpLimiter, authController.resendVerificationOtp);
router.post('/login', authLimiter, authController.loginUser);
router.post('/forgot-password', authLimiter, authController.forgotPassword);
router.post('/verify-reset-otp', otpLimiter, authController.verifyResetOtp);
router.post('/reset-password', authLimiter, authController.resetPassword);
router.post('/change-password', authUser, authController.changePassword);
router.post('/logout', authController.logoutUser);
router.get('/me', authUser, authController.getCurrentUser);

module.exports = router;
