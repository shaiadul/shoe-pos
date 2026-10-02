const mongoose = require('mongoose');
const BaseService = require('./BaseService');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const logActivity = require('../utils/logActivity');

class OrderService extends BaseService {
  constructor() {
    super(Order);
  }

  async getOrders({ status, paymentMethod, startDate, endDate, page = 1, limit = 20, search, customerId }) {
    const query = {};
    if (status) query.status = status;
    if (paymentMethod) query.paymentMethod = paymentMethod;
    if (customerId) query.customer = customerId;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }
    if (search) {
      query.$or = [
        { orderNumber: new RegExp(search, 'i') },
        { customerName: new RegExp(search, 'i') },
      ];
    }

    const total = await this.model.countDocuments(query);
    const orders = await this.model.find(query)
      .populate('customer', 'name phone email dueBalance')
      .populate('cashier', 'name')
      .sort('-createdAt')
      .skip((+page - 1) * +limit)
      .limit(+limit);

    return {
      orders,
      total,
      page: +page,
      limit: +limit,
    };
  }

  async getOrder(id) {
    const order = await this.model.findById(id).populate('customer').populate('cashier', 'name');
    if (!order) {
      const err = new Error('Order not found');
      err.statusCode = 404;
      throw err;
    }
    return order;
  }

  async createOrder(orderBody, actor, ip) {
    const {
      items,
      customer,
      customerName,
      paymentMethod,
      paymentDetails,
      subtotal,
      discountAmount,
      taxAmount,
      taxRate,
      taxName,
      total,
      paidAmount,
      notes,
    } = orderBody;

    // Calculate due
    const paid = parseFloat(paidAmount) || (paymentMethod === 'due' ? 0 : total);
    const due = Math.max(0, total - paid);

    // Validate: due orders MUST have a customer
    if (due > 0 && !customer) {
      const err = new Error('A customer must be selected for due/partial payment orders.');
      err.statusCode = 400;
      throw err;
    }

    // Deduct stock for each item
    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) {
        const err = new Error(`Product ${item.name} not found`);
        err.statusCode = 404;
        throw err;
      }
      const variant = product.variants.find(
        (v) => v.size === item.size && (!item.color || v.color === item.color)
      );
      if (!variant) {
        const err = new Error(`Size ${item.size} not available for ${item.name}`);
        err.statusCode = 400;
        throw err;
      }
      if (variant.stock < item.quantity) {
        const err = new Error(`Insufficient stock for ${item.name} size ${item.size}`);
        err.statusCode = 400;
        throw err;
      }
      variant.stock -= item.quantity;
      product.sold = (product.sold || 0) + item.quantity;
      await product.save();
    }

    const order = await this.model.create({
      items,
      customer,
      customerName: customerName || 'Walk-in Customer',
      paymentMethod,
      paymentDetails,
      subtotal,
      discountAmount,
      taxAmount,
      taxRate,
      taxName,
      total,
      paidAmount: paid,
      dueAmount: due,
      notes,
      cashier: actor._id,
      cashierName: actor.name,
      store: actor.store || 'Main Store',
    });

    // Update customer stats + due balance
    if (customer) {
      await Customer.findByIdAndUpdate(customer, {
        $inc: {
          totalPurchases: 1,
          totalSpent: paid,
          loyaltyPoints: Math.floor(paid / 100),
          dueBalance: due,
          totalDue: due,
        },
      });
    }

    const populated = await this.model.findById(order._id)
      .populate('customer', 'name phone dueBalance')
      .populate('cashier', 'name');

    logActivity({
      action: 'ORDER_CREATED',
      description: `Completed order #${populated.orderNumber} for $${populated.total.toFixed(2)} (${populated.customerName})`,
      user: actor,
      entityType: 'Order',
      entityId: populated._id,
      metadata: {
        orderNumber: populated.orderNumber,
        total: populated.total,
        paidAmount: populated.paidAmount,
        dueAmount: populated.dueAmount,
        paymentMethod: populated.paymentMethod,
        itemCount: populated.items?.length,
      },
      ip,
    });

    return populated;
  }

  async updateOrderStatus(id, status, actor, ip) {
    const order = await this.model.findByIdAndUpdate(id, { status }, { new: true });
    if (!order) {
      const err = new Error('Order not found');
      err.statusCode = 404;
      throw err;
    }

    const action =
      status === 'refunded'
        ? 'ORDER_REFUNDED'
        : status === 'cancelled'
        ? 'ORDER_CANCELLED'
        : 'ORDER_CREATED';

    logActivity({
      action,
      description: `Order #${order.orderNumber} status changed to "${status}"`,
      user: actor,
      entityType: 'Order',
      entityId: order._id,
      metadata: { status, orderNumber: order.orderNumber },
      ip,
    });

    return order;
  }

  async getTodayStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const stats = await this.model.aggregate([
      { $match: { createdAt: { $gte: today, $lt: tomorrow }, status: 'completed' } },
      {
        $group: {
          _id: null,
          totalSales: { $sum: '$paidAmount' },
          totalDue: { $sum: '$dueAmount' },
          count: { $sum: 1 },
          avgOrder: { $avg: '$total' },
        },
      },
    ]);

    return stats[0] || { totalSales: 0, totalDue: 0, count: 0, avgOrder: 0 };
  }

  async getCustomerSales(customerId, { page = 1, limit = 20 }) {
    const total = await this.model.countDocuments({ customer: customerId });
    const orders = await this.model.find({ customer: customerId })
      .sort('-createdAt')
      .skip((+page - 1) * +limit)
      .limit(+limit);

    const summary = await this.model.aggregate([
      { $match: { customer: mongoose.Types.ObjectId.createFromHexString(customerId) } },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalSpent: { $sum: '$paidAmount' },
          totalDue: { $sum: '$dueAmount' },
          totalValue: { $sum: '$total' },
        },
      },
    ]);

    return {
      orders,
      total,
      page: +page,
      limit: +limit,
      summary: summary[0] || { totalOrders: 0, totalSpent: 0, totalDue: 0, totalValue: 0 },
    };
  }
}

module.exports = new OrderService();
