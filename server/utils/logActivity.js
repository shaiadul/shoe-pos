const ActivityLog = require('../models/ActivityLog');
const logger = require('./logger');

/**
 * Log an activity event for audit trail.
 * @param {Object} params
 * @param {string} params.action - The action enum value
 * @param {string} params.description - Human-readable description
 * @param {Object} [params.user] - The user object (from req.user)
 * @param {string} [params.entityType] - Type of entity affected
 * @param {string} [params.entityId] - ID of entity affected
 * @param {Object} [params.metadata] - Additional data
 * @param {string} [params.ip] - Client IP address
 */
const logActivity = async ({ action, description, user, entityType, entityId, metadata, ip }) => {
  try {
    await ActivityLog.create({
      action,
      description,
      user: user?._id || user?.id,
      userName: user?.name || 'System',
      entityType,
      entityId,
      metadata: metadata || {},
      ip,
    });
    logger.debug(`Activity: [${action}] ${description}`, { userId: user?._id, entityType, entityId });
  } catch (err) {
    // Never let activity logging crash the main flow
    logger.error('Failed to log activity', { error: err.message, action, description });
  }
};

module.exports = logActivity;
