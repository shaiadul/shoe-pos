const BaseController = require('../core/BaseController');
const settingsService = require('../services/settingsService');

class SettingsController extends BaseController {
  constructor(service = settingsService) {
    super();
    this.service = service;
  }

  async getSettings(req, res, next) {
    try {
      const settings = await this.service.getSettings();
      return this.sendSuccess(res, { settings });
    } catch (err) {
      next(err);
    }
  }

  async updateSettings(req, res, next) {
    try {
      const settings = await this.service.updateSettings(req.body, req.user, req.ip);
      return this.sendSuccess(res, { settings });
    } catch (err) {
      next(err);
    }
  }
}

const settingsController = new SettingsController();

module.exports = settingsController;
module.exports.SettingsController = SettingsController;
module.exports.getSettings = settingsController.getSettings;
module.exports.updateSettings = settingsController.updateSettings;
