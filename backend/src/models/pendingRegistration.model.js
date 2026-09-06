const mongoose = require('mongoose');

const pendingRegistrationSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    username: { type: String, required: true, trim: true, lowercase: true },
    email: { type: String, required: true, lowercase: true, trim: true, unique: true },
    passwordHash: { type: String, required: true },
    codeHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    attempts: { type: Number, default: 0 },
    lastSentAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

// TTL Index: automatically delete unverified pending registrations after 15 minutes
pendingRegistrationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 900 });

const pendingRegistrationModel = mongoose.model('pending_registration', pendingRegistrationSchema);

module.exports = pendingRegistrationModel;
