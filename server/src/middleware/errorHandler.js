// Central error handler — never expose stack traces in production
const errorHandler = (err, req, res, _next) => {
  console.error('[Error]', err.message);
  const status = err.status || 500;
  const code = err.code || 'SERVER_ERROR';
  const message = process.env.NODE_ENV === 'production' && status === 500
    ? 'An unexpected error occurred.'
    : err.message || 'An unexpected error occurred.';
  res.status(status).json({ error: { code, message } });
};

module.exports = errorHandler;
