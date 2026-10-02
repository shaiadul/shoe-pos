const BaseService = require('./BaseService');
const Customer = require('../models/Customer');
const Order = require('../models/Order');
const logActivity = require('../utils/logActivity');

class CustomerService extends BaseService {
  constructor() {
    super(Customer);
  }

  async getCustomers({ search, page = 1, limit = 20, hasDue }) {
    const query = { isActive: true };
    if (search) {
      query.$or = [
        { name: new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') },
        { phone: new RegExp(search, 'i') },
      ];
    }
    if (hasDue === 'true') query.dueBalance = { $gt: 0 };

    const total = await this.model.countDocuments(query);
    const customers = await this.model.find(query)
      .sort('-createdAt')
      .skip((+page - 1) * +limit)
      .limit(+limit);

    return { customers, total, page: +page, limit: +limit };
  }

  async getCustomer(id) {
    const customer = await this.model.findById(id);
    if (!customer) {
      const err = new Error('Customer not found');
      err.statusCode = 404;
      throw err;
    }
    const orders = await Order.find({ customer: id }).sort('-createdAt').limit(20);
    return { customer, orders };
  }

  async createCustomer(data, actor, ip) {
    const customer = await this.model.create(data);

    logActivity({
      action: 'CUSTOMER_CREATED',
      description: `Added new customer "${customer.name}" (${customer.phone})`,
      user: actor,
      entityType: 'Customer',
      entityId: customer._id,
      metadata: { phone: customer.phone, email: customer.email },
      ip,
    });

    return customer;
  }

  async updateCustomer(id, data, actor, ip) {
    const customer = await this.model.findByIdAndUpdate(id, data, { new: true, runValidators: true });
    if (!customer) {
      const err = new Error('Customer not found');
      err.statusCode = 404;
      throw err;
    }

    logActivity({
      action: 'CUSTOMER_UPDATED',
      description: `Updated customer profile for "${customer.name}"`,
      user: actor,
      entityType: 'Customer',
      entityId: customer._id,
      metadata: { changes: Object.keys(data) },
      ip,
    });

    return customer;
  }

  async deleteCustomer(id, actor, ip) {
    const customer = await this.model.findByIdAndUpdate(id, { isActive: false });
    if (customer) {
      logActivity({
        action: 'CUSTOMER_DELETED',
        description: `Deactivated customer "${customer.name}"`,
        user: actor,
        entityType: 'Customer',
        entityId: customer._id,
        ip,
      });
    }
    return customer;
  }

  async searchCustomers(q) {
    return this.model.find({
      isActive: true,
      $or: [
        { name: new RegExp(q, 'i') },
        { email: new RegExp(q, 'i') },
        { phone: new RegExp(q, 'i') },
      ],
    }).limit(10);
  }

  async payDue(id, { amount, note, receivedBy }, actor, ip) {
    const customer = await this.model.findById(id);
    if (!customer) {
      const err = new Error('Customer not found');
      err.statusCode = 404;
      throw err;
    }

    const payAmount = parseFloat(amount);
    if (payAmount <= 0) {
      const err = new Error('Amount must be greater than 0');
      err.statusCode = 400;
      throw err;
    }
    if (payAmount > customer.dueBalance) {
      const err = new Error(`Cannot pay more than due balance (${customer.dueBalance})`);
      err.statusCode = 400;
      throw err;
    }

    customer.dueBalance -= payAmount;
    customer.totalDuePaid += payAmount;
    customer.totalSpent += payAmount;
    customer.duePayments.push({
      amount: payAmount,
      note: note || '',
      receivedBy: receivedBy || 'Staff',
      paidAt: new Date(),
    });

    await customer.save();

    logActivity({
      action: 'CUSTOMER_DUE_PAID',
      description: `Collected due payment of $${payAmount.toFixed(2)} from "${customer.name}". Remaining due: $${customer.dueBalance.toFixed(2)}`,
      user: actor,
      entityType: 'Customer',
      entityId: customer._id,
      metadata: { paidAmount: payAmount, remainingDue: customer.dueBalance, note },
      ip,
    });

    return { customer, payAmount };
  }

  async getDueSummary() {
    const summary = await this.model.aggregate([
      { $match: { isActive: true, dueBalance: { $gt: 0 } } },
      { $group: { _id: null, totalDue: { $sum: '$dueBalance' }, count: { $sum: 1 } } },
    ]);
    const topDebtors = await this.model.find({ isActive: true, dueBalance: { $gt: 0 } })
      .sort('-dueBalance')
      .limit(5)
      .select('name phone dueBalance');

    return {
      summary: summary[0] || { totalDue: 0, count: 0 },
      topDebtors,
    };
  }
}

module.exports = new CustomerService();
