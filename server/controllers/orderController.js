const BaseController = require('../core/BaseController');
const orderService = require('../services/orderService');

class OrderController extends BaseController {
  constructor(service = orderService) {
    super();
    this.service = service;
  }

  async getOrders(req, res, next) {
    try {
      const { orders, total, page, limit } = await this.service.getOrders(req.query);
      return this.sendPaginated(res, orders, total, page, limit, 'orders');
    } catch (err) {
      next(err);
    }
  }

  async getOrder(req, res, next) {
    try {
      const order = await this.service.getOrder(req.params.id);
      return this.sendSuccess(res, { order });
    } catch (err) {
      if (err.statusCode) return this.sendError(res, err.message, err.statusCode);
      next(err);
    }
  }

  async createOrder(req, res, next) {
    try {
      const order = await this.service.createOrder(req.body, req.user, req.ip);
      this.getIo(req)?.emit('newOrder', order);
      return this.sendSuccess(res, { order }, 201);
    } catch (err) {
      if (err.statusCode) return this.sendError(res, err.message, err.statusCode);
      next(err);
    }
  }

  async updateOrderStatus(req, res, next) {
    try {
      const { status } = req.body;
      const order = await this.service.updateOrderStatus(req.params.id, status, req.user, req.ip);
      this.getIo(req)?.emit('orderUpdated', order);
      return this.sendSuccess(res, { order });
    } catch (err) {
      if (err.statusCode) return this.sendError(res, err.message, err.statusCode);
      next(err);
    }
  }

  async getTodayStats(req, res, next) {
    try {
      const stats = await this.service.getTodayStats();
      return this.sendSuccess(res, { stats });
    } catch (err) {
      next(err);
    }
  }

  async getCustomerSales(req, res, next) {
    try {
      const { orders, total, page, limit, summary } = await this.service.getCustomerSales(
        req.params.id,
        req.query
      );
      return this.sendPaginated(res, orders, total, page, limit, 'orders', { summary });
    } catch (err) {
      next(err);
    }
  }
}

const orderController = new OrderController();

module.exports = orderController;
module.exports.OrderController = OrderController;
module.exports.getOrders = orderController.getOrders;
module.exports.getOrder = orderController.getOrder;
module.exports.createOrder = orderController.createOrder;
module.exports.updateOrderStatus = orderController.updateOrderStatus;
module.exports.getTodayStats = orderController.getTodayStats;
module.exports.getCustomerSales = orderController.getCustomerSales;
