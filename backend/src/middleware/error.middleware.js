function notFound(req, res) {
  res.status(404).json({ message: 'Route not found' });
}

// Centralized error handler — every asyncHandler-wrapped controller and every
// multer error lands here, so error responses stay consistent app-wide.
function errorHandler(err, req, res, next) {
  console.error(err);

  if (err.name === 'MulterError' || err.message?.includes('Only JPG, PNG, WEBP or PDF')) {
    return res.status(400).json({ message: err.message });
  }

  if (err.code === 11000) {
    return res.status(409).json({ message: 'An account with this email already exists' });
  }

  if (err.name === 'ValidationError') {
    return res.status(400).json({ message: err.message });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({ message: 'Invalid ID format' });
  }

  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({ message: 'Session expired — please log in again' });
  }

  const status = err.status || 500;
  res.status(status).json({
    message: status === 500 ? 'Something went wrong on our end' : err.message
  });
}

module.exports = { notFound, errorHandler };
