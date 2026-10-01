const Expense = require('../models/Expense');
const logActivity = require('../utils/logActivity');

exports.getExpenses = async (req, res, next) => {
  try {
    const { category, startDate, endDate, page = 1, limit = 20, search } = req.query;
    const query = {};
    if (category) query.category = category;
    if (search) query.title = new RegExp(search, 'i');
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) { const end = new Date(endDate); end.setHours(23, 59, 59, 999); query.date.$lte = end; }
    }

    const total = await Expense.countDocuments(query);
    const expenses = await Expense.find(query)
      .populate('createdBy', 'name')
      .sort('-date')
      .skip((+page - 1) * +limit)
      .limit(+limit);

    // Calculate total for the filtered set
    const totalAmount = await Expense.aggregate([
      { $match: query },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    res.json({
      success: true,
      count: expenses.length,
      total,
      totalAmount: totalAmount[0]?.total || 0,
      pages: Math.ceil(total / +limit),
      page: +page,
      expenses,
    });
  } catch (err) { next(err); }
};

exports.getExpense = async (req, res, next) => {
  try {
    const expense = await Expense.findById(req.params.id).populate('createdBy', 'name');
    if (!expense) return res.status(404).json({ success: false, message: 'Expense not found' });
    res.json({ success: true, expense });
  } catch (err) { next(err); }
};

exports.createExpense = async (req, res, next) => {
  try {
    const expense = await Expense.create({
      ...req.body,
      createdBy: req.user._id,
      createdByName: req.user.name,
      store: req.user.store || 'Main Store',
    });

    logActivity({
      action: 'EXPENSE_CREATED',
      description: `Created expense "${expense.title}" for ${expense.amount}`,
      user: req.user,
      entityType: 'Expense',
      entityId: expense._id,
      metadata: { amount: expense.amount, category: expense.category },
      ip: req.ip,
    });

    res.status(201).json({ success: true, expense });
  } catch (err) { next(err); }
};

exports.updateExpense = async (req, res, next) => {
  try {
    const expense = await Expense.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!expense) return res.status(404).json({ success: false, message: 'Expense not found' });

    logActivity({
      action: 'EXPENSE_UPDATED',
      description: `Updated expense "${expense.title}"`,
      user: req.user,
      entityType: 'Expense',
      entityId: expense._id,
      ip: req.ip,
    });

    res.json({ success: true, expense });
  } catch (err) { next(err); }
};

exports.deleteExpense = async (req, res, next) => {
  try {
    const expense = await Expense.findByIdAndDelete(req.params.id);
    if (!expense) return res.status(404).json({ success: false, message: 'Expense not found' });

    logActivity({
      action: 'EXPENSE_DELETED',
      description: `Deleted expense "${expense.title}" (${expense.amount})`,
      user: req.user,
      entityType: 'Expense',
      entityId: expense._id,
      ip: req.ip,
    });

    res.json({ success: true, message: 'Expense deleted' });
  } catch (err) { next(err); }
};

exports.getExpenseSummary = async (req, res, next) => {
  try {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);

    const [todayExpenses, monthExpenses, lastMonthExpenses, byCategory] = await Promise.all([
      Expense.aggregate([
        { $match: { date: { $gte: today } } },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
      ]),
      Expense.aggregate([
        { $match: { date: { $gte: thisMonth } } },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
      ]),
      Expense.aggregate([
        { $match: { date: { $gte: lastMonth, $lte: lastMonthEnd } } },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
      ]),
      Expense.aggregate([
        { $match: { date: { $gte: thisMonth } } },
        { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } },
        { $sort: { total: -1 } },
      ]),
    ]);

    res.json({
      success: true,
      summary: {
        todayExpenses: todayExpenses[0]?.total || 0,
        todayCount: todayExpenses[0]?.count || 0,
        monthExpenses: monthExpenses[0]?.total || 0,
        monthCount: monthExpenses[0]?.count || 0,
        lastMonthExpenses: lastMonthExpenses[0]?.total || 0,
        byCategory,
      },
    });
  } catch (err) { next(err); }
};
