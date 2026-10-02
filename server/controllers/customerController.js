const BaseController = require('../core/BaseController');
const customerService = require('../services/customerService');

class CustomerController extends BaseController {
  constructor(service = customerService) {
    super();
    this.service = service;
  }

  async getCustomers(req, res, next) {
    try {
      const { customers, total, page, limit } = await this.service.getCustomers(req.query);
      return this.sendPaginated(res, customers, total, page, limit, 'customers');
    } catch (err) {
      next(err);
    }
  }

  async getCustomer(req, res, next) {
    try {
      const { customer, orders } = await this.service.getCustomer(req.params.id);
      return this.sendSuccess(res, { customer, orders });
    } catch (err) {
      if (err.statusCode) return this.sendError(res, err.message, err.statusCode);
      next(err);
    }
  }

  async createCustomer(req, res, next) {
    try {
      const customer = await this.service.createCustomer(req.body, req.user, req.ip);
      return this.sendSuccess(res, { customer }, 201);
    } catch (err) {
      next(err);
    }
  }

  async updateCustomer(req, res, next) {
    try {
      const customer = await this.service.updateCustomer(req.params.id, req.body, req.user, req.ip);
      return this.sendSuccess(res, { customer });
    } catch (err) {
      if (err.statusCode) return this.sendError(res, err.message, err.statusCode);
      next(err);
    }
  }

  async deleteCustomer(req, res, next) {
    try {
      await this.service.deleteCustomer(req.params.id, req.user, req.ip);
      return this.sendSuccess(res, { message: 'Customer deleted' });
    } catch (err) {
      next(err);
    }
  }

  async searchCustomers(req, res, next) {
    try {
      const customers = await this.service.searchCustomers(req.query.q);
      return this.sendSuccess(res, { customers });
    } catch (err) {
      next(err);
    }
  }

  async payDue(req, res, next) {
    try {
      const { customer, payAmount } = await this.service.payDue(
        req.params.id,
        req.body,
        req.user,
        req.ip
      );

      this.getIo(req)?.emit('duePayment', {
        customerId: customer._id,
        dueBalance: customer.dueBalance,
        paidAmount: payAmount,
      });

      return this.sendSuccess(res, {
        customer,
        message: `Due payment of ${payAmount} recorded.`,
      });
    } catch (err) {
      if (err.statusCode) return this.sendError(res, err.message, err.statusCode);
      next(err);
    }
  }

  async getDueSummary(req, res, next) {
    try {
      const { summary, topDebtors } = await this.service.getDueSummary();
      return this.sendSuccess(res, { summary, topDebtors });
    } catch (err) {
      next(err);
    }
  }
}

const customerController = new CustomerController();

module.exports = customerController;
module.exports.CustomerController = CustomerController;
module.exports.getCustomers = customerController.getCustomers;
module.exports.getCustomer = customerController.getCustomer;
module.exports.createCustomer = customerController.createCustomer;
module.exports.updateCustomer = customerController.updateCustomer;
module.exports.deleteCustomer = customerController.deleteCustomer;
module.exports.searchCustomers = customerController.searchCustomers;
module.exports.payDue = customerController.payDue;
module.exports.getDueSummary = customerController.getDueSummary;
