const { getAuth } = require('@clerk/express');
const userModel = require('../models/user.model');
const jwt = require('jsonwebtoken');

async function authUser(req, res, next) {
  try {
    const auth = getAuth(req);

    // 1. Clerk Authentication
    if (auth && auth.userId) {
      req.clerkUserId = auth.userId;

      // Find or create MongoDB user mapped to this Clerk user
      let user = await userModel.findOne({ clerkId: auth.userId });
      if (!user) {
        const email = (auth.sessionClaims?.email || auth.sessionClaims?.primary_email || `${auth.userId}@clerk.user`).toLowerCase();
        user = await userModel.findOne({ email });

        if (user) {
          // Link existing user to Clerk ID
          user.clerkId = auth.userId;
          await user.save();
        } else {
          // Auto-provision new user record
          const fullName = auth.sessionClaims?.name || auth.sessionClaims?.fullName || 'AchievedIT User';
          const username = (auth.sessionClaims?.username || `user_${auth.userId.slice(-6)}`).toLowerCase();
          user = await userModel.create({
            clerkId: auth.userId,
            fullName,
            username,
            email,
            isEmailVerified: true
          });
        }
      }

      req.userId = user._id;
      req.user = user;
      return next();
    }

    // 2. Backend JWT or Clerk token verification
    let token = req.cookies?.token;
    if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      // Try verify with native JWT_SECRET first
      if (process.env.JWT_SECRET) {
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          const user = await userModel.findById(decoded.id);
          if (user) {
            req.userId = user._id;
            req.user = user;
            return next();
          }
        } catch (e) {
          // not our HS256 secret token, check Clerk decode below
        }
      }

      // Try decode as Clerk token
      try {
        const decodedClerk = jwt.decode(token);
        if (decodedClerk && (decodedClerk.sub || decodedClerk.clerkId)) {
          const clerkUserId = decodedClerk.sub || decodedClerk.clerkId;
          const email = (decodedClerk.email || decodedClerk.primary_email || decodedClerk.email_address || '').toLowerCase();

          let user = await userModel.findOne({
            $or: [
              ...(clerkUserId ? [{ clerkId: clerkUserId }] : []),
              ...(email ? [{ email }] : [])
            ]
          });

          if (!user && (clerkUserId || email)) {
            const fullName = decodedClerk.name || decodedClerk.fullName || 'AchievedIT User';
            const username = (decodedClerk.username || (email ? email.split('@')[0] : `user_${clerkUserId.slice(-6)}`)).toLowerCase();
            user = await userModel.create({
              clerkId: clerkUserId || undefined,
              fullName,
              username,
              email: email || `${clerkUserId}@clerk.user`,
              isEmailVerified: true
            });
          }

          if (user) {
            if (clerkUserId && !user.clerkId) {
              user.clerkId = clerkUserId;
              await user.save();
            }
            req.userId = user._id;
            req.user = user;
            return next();
          }
        }
      } catch (clerkErr) {
        // ignore
      }
    }

    return res.status(401).json({ message: 'Please log in to continue', code: 'NO_SESSION' });
  } catch (err) {
    console.error('Auth middleware error:', err);
    return res.status(401).json({ message: 'Authentication error', code: 'INVALID_SESSION' });
  }
}

module.exports = { authUser };
