const BaseController = require('../core/BaseController');
const dashboardService = require('../services/dashboardService');

class DashboardController extends BaseController {
  constructor(service = dashboardService) {
    super();
    this.service = service;
  }

  async getDashboard(req, res, next) {
    try {
      const data = await this.service.getDashboard();
      return this.sendSuccess(res, data);
    } catch (err) {
      next(err);
    }
  }

  async getSalesReport(req, res, next) {
    try {
      const report = await this.service.getSalesReport(req.query);
      return this.sendSuccess(res, { report });
    } catch (err) {
      next(err);
    }
  }
}

const dashboardController = new DashboardController();

module.exports = dashboardController;
module.exports.DashboardController = DashboardController;
module.exports.getDashboard = dashboardController.getDashboard;
module.exports.getSalesReport = dashboardController.getSalesReport;
