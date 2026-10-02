const BaseController = require('../core/BaseController');
const expenseService = require('../services/expenseService');

class ExpenseController extends BaseController {
  constructor(service = expenseService) {
    super();
    this.service = service;
  }

  async getExpenses(req, res, next) {
    try {
      const { expenses, total, totalAmount, page, limit } = await this.service.getExpenses(req.query);
      return this.sendPaginated(res, expenses, total, page, limit, 'expenses', { totalAmount });
    } catch (err) {
      next(err);
    }
  }

  async getExpense(req, res, next) {
    try {
      const expense = await this.service.getExpense(req.params.id);
      return this.sendSuccess(res, { expense });
    } catch (err) {
      if (err.statusCode) return this.sendError(res, err.message, err.statusCode);
      next(err);
    }
  }

  async createExpense(req, res, next) {
    try {
      const expense = await this.service.createExpense(req.body, req.user, req.ip);
      return this.sendSuccess(res, { expense }, 201);
    } catch (err) {
      next(err);
    }
  }

  async updateExpense(req, res, next) {
    try {
      const expense = await this.service.updateExpense(req.params.id, req.body, req.user, req.ip);
      return this.sendSuccess(res, { expense });
    } catch (err) {
      if (err.statusCode) return this.sendError(res, err.message, err.statusCode);
      next(err);
    }
  }

  async deleteExpense(req, res, next) {
    try {
      await this.service.deleteExpense(req.params.id, req.user, req.ip);
      return this.sendSuccess(res, { message: 'Expense deleted' });
    } catch (err) {
      if (err.statusCode) return this.sendError(res, err.message, err.statusCode);
      next(err);
    }
  }

  async getExpenseSummary(req, res, next) {
    try {
      const summary = await this.service.getExpenseSummary();
      return this.sendSuccess(res, { summary });
    } catch (err) {
      next(err);
    }
  }
}

const expenseController = new ExpenseController();

module.exports = expenseController;
module.exports.ExpenseController = ExpenseController;
module.exports.getExpenses = expenseController.getExpenses;
module.exports.getExpense = expenseController.getExpense;
module.exports.createExpense = expenseController.createExpense;
module.exports.updateExpense = expenseController.updateExpense;
module.exports.deleteExpense = expenseController.deleteExpense;
module.exports.getExpenseSummary = expenseController.getExpenseSummary;
