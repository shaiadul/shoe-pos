const BaseService = require('./BaseService');
const Expense = require('../models/Expense');
const logActivity = require('../utils/logActivity');

class ExpenseService extends BaseService {
  constructor() {
    super(Expense);
  }

  async getExpenses({ category, startDate, endDate, page = 1, limit = 20, search }) {
    const query = {};
    if (category) query.category = category;
    if (search) query.title = new RegExp(search, 'i');
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.date.$lte = end;
      }
    }

    const total = await this.model.countDocuments(query);
    const expenses = await this.model.find(query)
      .populate('createdBy', 'name')
      .sort('-date')
      .skip((+page - 1) * +limit)
      .limit(+limit);

    const totalAmount = await this.model.aggregate([
      { $match: query },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    return {
      expenses,
      total,
      totalAmount: totalAmount[0]?.total || 0,
      page: +page,
      limit: +limit,
    };
  }

  async getExpense(id) {
    const expense = await this.model.findById(id).populate('createdBy', 'name');
    if (!expense) {
      const err = new Error('Expense not found');
      err.statusCode = 404;
      throw err;
    }
    return expense;
  }

  async createExpense(data, user, ip) {
    const expense = await this.model.create({
      ...data,
      createdBy: user._id,
      createdByName: user.name,
      store: user.store || 'Main Store',
    });

    logActivity({
      action: 'EXPENSE_CREATED',
      description: `Created expense "${expense.title}" for ${expense.amount}`,
      user,
      entityType: 'Expense',
      entityId: expense._id,
      metadata: { amount: expense.amount, category: expense.category },
      ip,
    });

    return expense;
  }

  async updateExpense(id, data, user, ip) {
    const expense = await this.model.findByIdAndUpdate(id, data, { new: true, runValidators: true });
    if (!expense) {
      const err = new Error('Expense not found');
      err.statusCode = 404;
      throw err;
    }

    logActivity({
      action: 'EXPENSE_UPDATED',
      description: `Updated expense "${expense.title}"`,
      user,
      entityType: 'Expense',
      entityId: expense._id,
      ip,
    });

    return expense;
  }

  async deleteExpense(id, user, ip) {
    const expense = await this.model.findByIdAndDelete(id);
    if (!expense) {
      const err = new Error('Expense not found');
      err.statusCode = 404;
      throw err;
    }

    logActivity({
      action: 'EXPENSE_DELETED',
      description: `Deleted expense "${expense.title}" (${expense.amount})`,
      user,
      entityType: 'Expense',
      entityId: expense._id,
      ip,
    });

    return expense;
  }

  async getExpenseSummary() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);

    const [todayExpenses, monthExpenses, lastMonthExpenses, byCategory] = await Promise.all([
      this.model.aggregate([
        { $match: { date: { $gte: today } } },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
      ]),
      this.model.aggregate([
        { $match: { date: { $gte: thisMonth } } },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
      ]),
      this.model.aggregate([
        { $match: { date: { $gte: lastMonth, $lte: lastMonthEnd } } },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
      ]),
      this.model.aggregate([
        { $match: { date: { $gte: thisMonth } } },
        { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } },
        { $sort: { total: -1 } },
      ]),
    ]);

    return {
      todayExpenses: todayExpenses[0]?.total || 0,
      todayCount: todayExpenses[0]?.count || 0,
      monthExpenses: monthExpenses[0]?.total || 0,
      monthCount: monthExpenses[0]?.count || 0,
      lastMonthExpenses: lastMonthExpenses[0]?.total || 0,
      byCategory,
    };
  }
}

module.exports = new ExpenseService();
