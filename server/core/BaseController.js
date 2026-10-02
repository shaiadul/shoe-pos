/**
 * BaseController
 * Abstract base class providing standardized HTTP responses, error handling,
 * and automatic method binding for all derived controller classes.
 */
class BaseController {
  constructor() {
    this._bindMethods();
  }

  /**
   * Automatically bind all instance methods to 'this'
   * so they can be passed safely as Express middleware callbacks.
   */
  _bindMethods() {
    const prototype = Object.getPrototypeOf(this);
    const methodNames = Object.getOwnPropertyNames(prototype);
    for (const name of methodNames) {
      if (name !== 'constructor' && typeof this[name] === 'function') {
        this[name] = this[name].bind(this);
      }
    }
  }

  /**
   * Standard JSON success response
   */
  sendSuccess(res, data = {}, statusCode = 200) {
    return res.status(statusCode).json({
      success: true,
      ...data,
    });
  }

  /**
   * Standard paginated response
   */
  sendPaginated(res, items, total, page = 1, limit = 20, key = 'items', extra = {}) {
    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 20;
    return res.json({
      success: true,
      count: items.length,
      total,
      pages: Math.ceil(total / limitNum) || 1,
      page: pageNum,
      [key]: items,
      ...extra,
    });
  }

  /**
   * Standard JSON error response
   */
  sendError(res, message = 'Something went wrong', statusCode = 500, extra = {}) {
    return res.status(statusCode).json({
      success: false,
      message,
      ...extra,
    });
  }

  /**
   * Helper to retrieve Socket.io instance from the Express request
   */
  getIo(req) {
    return req?.app?.get('io');
  }
}

module.exports = BaseController;
