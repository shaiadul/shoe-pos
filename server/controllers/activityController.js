const BaseController = require('../core/BaseController');
const activityService = require('../services/activityService');

class ActivityController extends BaseController {
  constructor(service = activityService) {
    super();
    this.service = service;
  }

  async getActivityLogs(req, res, next) {
    try {
      const { logs, total, page, limit } = await this.service.getActivityLogs(req.query);
      return this.sendPaginated(res, logs, total, page, limit, 'logs');
    } catch (err) {
      next(err);
    }
  }

  async getActivityStats(req, res, next) {
    try {
      const stats = await this.service.getActivityStats();
      return this.sendSuccess(res, { stats });
    } catch (err) {
      next(err);
    }
  }
}

const activityController = new ActivityController();

module.exports = activityController;
module.exports.ActivityController = ActivityController;
module.exports.getActivityLogs = activityController.getActivityLogs;
module.exports.getActivityStats = activityController.getActivityStats;
