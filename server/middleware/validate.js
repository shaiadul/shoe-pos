const logger = require('../utils/logger');

/**
 * Middleware factory for validating request body, query, or params with a Zod schema.
 * @param {import('zod').ZodSchema} schema - Zod validation schema
 * @param {'body' | 'query' | 'params'} [source='body'] - Request property to validate
 */
const validate = (schema, source = 'body') => (req, res, next) => {
  try {
    const result = schema.safeParse(req[source]);

    if (!result.success) {
      const issues = result.error.issues || result.error.errors || [];
      const fieldErrors = {};
      const formattedErrors = issues.map((issue) => {
        const field = issue.path.join('.') || 'field';
        if (!fieldErrors[field]) {
          fieldErrors[field] = issue.message;
        }
        return {
          field,
          message: issue.message,
        };
      });

      // User-facing message: Use the first descriptive message
      const primaryMessage = formattedErrors.length > 0
        ? formattedErrors[0].message
        : 'Invalid request data';

      logger.warn(`Validation failed on ${req.method} ${req.originalUrl}: ${primaryMessage}`, {
        errors: formattedErrors,
        ip: req.ip,
      });

      return res.status(400).json({
        success: false,
        message: primaryMessage,
        errors: formattedErrors,
        fieldErrors,
      });
    }

    // Replace with sanitized/coerced values from Zod
    req[source] = result.data;
    next();
  } catch (err) {
    logger.error('Unexpected error in validation middleware', { error: err.message });
    return res.status(500).json({
      success: false,
      message: 'Internal validation error',
    });
  }
};

module.exports = validate;
