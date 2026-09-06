const jwt = require('jsonwebtoken');

function authUser(req, res, next) {
  let token = req.cookies?.token;

  if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ message: 'Please log in to continue', code: 'NO_SESSION' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Your session has expired — please log in again', code: 'SESSION_EXPIRED' });
    }
    return res.status(401).json({ message: 'Please log in to continue', code: 'INVALID_SESSION' });
  }
}

module.exports = { authUser };
