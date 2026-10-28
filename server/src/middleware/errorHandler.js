// Central error handler
const errorHandler = (err, req, res, _next) => {
  console.error('[Error Handler]', err);
  const status = err.status || (err.name === 'ValidationError' ? 400 : 500);
  const code = err.code || (err.name === 'MongoServerSelectionError' ? 'DATABASE_ERROR' : 'SERVER_ERROR');

  let message = err.message || 'An unexpected error occurred.';
  if (err.name === 'MongoServerSelectionError' || err.name === 'MongoNetworkError') {
    message = 'Database service is temporarily reconnecting. Please retry in a few moments.';
  }

  res.status(status).json({ error: { code, message } });
};

module.exports = errorHandler;
