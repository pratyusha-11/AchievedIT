const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema(
  {
    codeHash: { type: String, default: null },
    expiresAt: { type: Date, default: null },
    attempts: { type: Number, default: 0 },
    lastSentAt: { type: Date, default: null }
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    clerkId: { type: String, unique: true, sparse: true, index: true },
    fullName: { type: String, required: true, trim: true, default: 'User' },
    username: { type: String, sparse: true, trim: true, lowercase: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: false },
    isEmailVerified: { type: Boolean, default: true },
    emailVerificationOtp: { type: otpSchema, default: () => ({}) },
    passwordResetOtp: { type: otpSchema, default: () => ({}) }
  },
  { timestamps: true }
);

const userModel = mongoose.model('user', userSchema);

module.exports = userModel;
