const BaseService = require('./BaseService');
const Settings = require('../models/Settings');
const logActivity = require('../utils/logActivity');

class SettingsService extends BaseService {
  constructor() {
    super(Settings);
  }

  async getSettings() {
    let settings = await this.model.findOne();
    if (!settings) {
      settings = await this.model.create({});
    }
    return settings;
  }

  async updateSettings(data, user, ip) {
    let settings = await this.model.findOne();
    if (!settings) {
      settings = await this.model.create(data);
    } else {
      Object.assign(settings, data);
      await settings.save();
    }

    logActivity({
      action: 'SETTINGS_UPDATED',
      description: `Store settings updated by ${user.name}`,
      user,
      entityType: 'Settings',
      entityId: settings._id,
      metadata: { fields: Object.keys(data) },
      ip,
    });

    return settings;
  }
}

module.exports = new SettingsService();
