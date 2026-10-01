const ActivityLog = require('../models/ActivityLog');

exports.getActivityLogs = async (req, res, next) => {
  try {
    const { action, entityType, userId, page = 1, limit = 30, startDate, endDate } = req.query;
    const query = {};
    if (action) query.action = action;
    if (entityType) query.entityType = entityType;
    if (userId) query.user = userId;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) { const end = new Date(endDate); end.setHours(23, 59, 59, 999); query.createdAt.$lte = end; }
    }

    const total = await ActivityLog.countDocuments(query);
    const logs = await ActivityLog.find(query)
      .populate('user', 'name email role')
      .sort('-createdAt')
      .skip((+page - 1) * +limit)
      .limit(+limit);

    res.json({
      success: true,
      count: logs.length,
      total,
      pages: Math.ceil(total / +limit),
      page: +page,
      logs,
    });
  } catch (err) { next(err); }
};

exports.getActivityStats = async (req, res, next) => {
  try {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const thisWeek = new Date(today); thisWeek.setDate(thisWeek.getDate() - 7);

    const [todayCount, weekCount, byAction, byUser] = await Promise.all([
      ActivityLog.countDocuments({ createdAt: { $gte: today } }),
      ActivityLog.countDocuments({ createdAt: { $gte: thisWeek } }),
      ActivityLog.aggregate([
        { $match: { createdAt: { $gte: thisWeek } } },
        { $group: { _id: '$action', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
      ActivityLog.aggregate([
        { $match: { createdAt: { $gte: thisWeek } } },
        { $group: { _id: '$userName', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
      ]),
    ]);

    res.json({ success: true, stats: { todayCount, weekCount, byAction, byUser } });
  } catch (err) { next(err); }
};
