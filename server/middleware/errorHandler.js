const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Server Error';

  // Mongoose bad ObjectId
  if (err.name === 'CastError') { message = 'Resource not found'; statusCode = 404; }
  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    message = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`;
    statusCode = 400;
  }
  // Mongoose validation error
  if (err.name === 'ValidationError') {
    message = Object.values(err.errors).map(val => val.message).join(', ');
    statusCode = 400;
  }

  // Zod validation error
  if (err.name === 'ZodError' || err.issues) {
    const issues = err.issues || [];
    const fieldErrors = {};
    const formattedErrors = issues.map((issue) => {
      const field = issue.path.join('.') || 'field';
      if (!fieldErrors[field]) fieldErrors[field] = issue.message;
      return { field, message: issue.message, code: issue.code };
    });
    message = formattedErrors.map(e => `${e.field}: ${e.message}`).join(', ') || 'Validation Error';
    statusCode = 400;
    return res.status(statusCode).json({
      success: false,
      message,
      errors: formattedErrors,
      fieldErrors,
    });
  }

  logger.error(`${statusCode} - ${message} - ${req.originalUrl} - ${req.method} - ${req.ip}`, {
    stack: err.stack,
    body: req.body,
    params: req.params,
    query: req.query,
  });

  res.status(statusCode).json({ success: false, message, ...(process.env.NODE_ENV === 'development' && { stack: err.stack }) });
};

module.exports = errorHandler;
