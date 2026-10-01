const Settings = require('../models/Settings');
const logActivity = require('../utils/logActivity');

exports.getSettings = async (req, res, next) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) settings = await Settings.create({});
    res.json({ success: true, settings });
  } catch (err) { next(err); }
};

exports.updateSettings = async (req, res, next) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) settings = await Settings.create(req.body);
    else {
      Object.assign(settings, req.body);
      await settings.save();
    }

    logActivity({
      action: 'SETTINGS_UPDATED',
      description: `Store settings updated by ${req.user.name}`,
      user: req.user,
      entityType: 'Settings',
      entityId: settings._id,
      metadata: { fields: Object.keys(req.body) },
      ip: req.ip,
    });

    res.json({ success: true, settings });
  } catch (err) { next(err); }
};
