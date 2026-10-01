const logger = require('../utils/logger');

const requestLogger = (req, res, next) => {
  const start = Date.now();

  // Log when response finishes
  res.on('finish', () => {
    const duration = Date.now() - start;
    const meta = {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip || req.connection?.remoteAddress,
      userAgent: req.get('user-agent')?.substring(0, 100),
      userId: req.user?._id?.toString(),
    };

    if (res.statusCode >= 500) {
      logger.error(`${req.method} ${req.originalUrl} ${res.statusCode}`, meta);
    } else if (res.statusCode >= 400) {
      logger.warn(`${req.method} ${req.originalUrl} ${res.statusCode}`, meta);
    } else {
      logger.http(`${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`, meta);
    }
  });

  next();
};

module.exports = requestLogger;
