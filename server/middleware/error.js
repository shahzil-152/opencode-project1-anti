const config = require('../config/env');
const ApiError = require('../utils/apiError');

/** 404 for unmatched API routes. */
function notFoundHandler(req, res, next) {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.path}`));
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  let status = err.statusCode || 500;
  let message = err.message || 'Something went wrong';

  // Mongoose cast errors (invalid ObjectId in URL)
  if (err.name === 'CastError') {
    status = 400;
    message = 'Invalid identifier';
  }

  // Mongoose schema validation
  if (err.name === 'ValidationError') {
    status = 422;
    message = 'Validation failed';
  }

  if (config.isProd && status >= 500) {
    console.error('[error]', err);
    message = 'Internal server error';
  } else if (status >= 500) {
    console.error('[error]', err);
  }

  res.status(status).json({
    message,
    errors: err.errors || undefined,
  });
}

module.exports = { notFoundHandler, errorHandler };
