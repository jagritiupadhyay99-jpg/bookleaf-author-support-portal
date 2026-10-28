// Central error handler — temporarily exposing full errors for diagnostics
const errorHandler = (err, req, res, _next) => {
  console.error('[Error]', err.message, err.stack);
  const status = err.status || 500;
  const code = err.code || 'SERVER_ERROR';
  // Temporarily expose real error message to diagnose production issue
  const message = err.message || 'An unexpected error occurred.';
  res.status(status).json({ error: { code, message } });
};

module.exports = errorHandler;
