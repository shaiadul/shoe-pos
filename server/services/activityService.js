const BaseService = require('./BaseService');
const ActivityLog = require('../models/ActivityLog');

class ActivityService extends BaseService {
  constructor() {
    super(ActivityLog);
  }

  async getActivityLogs({ action, entityType, userId, page = 1, limit = 30, startDate, endDate }) {
    const query = {};
    if (action) query.action = action;
    if (entityType) query.entityType = entityType;
    if (userId) query.user = userId;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    const total = await this.model.countDocuments(query);
    const logs = await this.model.find(query)
      .populate('user', 'name email role')
      .sort('-createdAt')
      .skip((+page - 1) * +limit)
      .limit(+limit);

    return {
      logs,
      total,
      page: +page,
      limit: +limit,
    };
  }

  async getActivityStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const thisWeek = new Date(today);
    thisWeek.setDate(thisWeek.getDate() - 7);

    const [todayCount, weekCount, byAction, byUser] = await Promise.all([
      this.model.countDocuments({ createdAt: { $gte: today } }),
      this.model.countDocuments({ createdAt: { $gte: thisWeek } }),
      this.model.aggregate([
        { $match: { createdAt: { $gte: thisWeek } } },
        { $group: { _id: '$action', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
      this.model.aggregate([
        { $match: { createdAt: { $gte: thisWeek } } },
        { $group: { _id: '$userName', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
      ]),
    ]);

    return { todayCount, weekCount, byAction, byUser };
  }
}

module.exports = new ActivityService();
