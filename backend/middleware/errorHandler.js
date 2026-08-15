// 404 handler for unmatched routes
function notFound(req, res, next) {
  res.status(404).json({ success: false, message: 'Route not found.' });
}

// Final error handler. Keeps error messages consistent and never leaks
// stack traces or internals to the client.
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  // eslint-disable-next-line no-console
  console.error('[error]', err);

  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ success: false, message: 'File is too large.' });
  }

  if (err.type === 'validation') {
    return res.status(400).json({ success: false, message: err.message, errors: err.errors });
  }

  const status = err.status || 500;
  const message = status === 500 ? 'Something went wrong. Please try again.' : err.message;

  res.status(status).json({ success: false, message });
}

module.exports = { notFound, errorHandler };
