function errorHandler(err, req, res, next) {
  const isJwtError = err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError';
  const status = err.status || (isJwtError ? 401 : 500);
  const message = isJwtError ? 'Session expired or invalid. Please log in again.' : (err.message || 'Internal Server Error');

  if (status >= 500) {
    console.error(`[Server Error ${status}]:`, err);
  } else {
    console.warn(`[Client ${status} on ${req.method} ${req.originalUrl}]:`, message);
  }

  res.status(status).json({
    success: false,
    message
  });
}

module.exports = errorHandler;

