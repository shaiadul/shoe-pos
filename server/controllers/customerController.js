const Customer = require('../models/Customer');
const Order = require('../models/Order');

exports.getCustomers = async (req, res, next) => {
  try {
    const { search, page = 1, limit = 20, hasDue } = req.query;
    const query = { isActive: true };
    if (search) query.$or = [
      { name: new RegExp(search, 'i') },
      { email: new RegExp(search, 'i') },
      { phone: new RegExp(search, 'i') },
    ];
    if (hasDue === 'true') query.dueBalance = { $gt: 0 };
    const total = await Customer.countDocuments(query);
    const customers = await Customer.find(query).sort('-createdAt').skip((+page - 1) * +limit).limit(+limit);
    res.json({ success: true, count: customers.length, total, pages: Math.ceil(total / +limit), customers });
  } catch (err) { next(err); }
};

exports.getCustomer = async (req, res, next) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });
    const orders = await Order.find({ customer: req.params.id }).sort('-createdAt').limit(20);
    res.json({ success: true, customer, orders });
  } catch (err) { next(err); }
};

exports.createCustomer = async (req, res, next) => {
  try {
    const customer = await Customer.create(req.body);
    res.status(201).json({ success: true, customer });
  } catch (err) { next(err); }
};

exports.updateCustomer = async (req, res, next) => {
  try {
    const customer = await Customer.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });
    res.json({ success: true, customer });
  } catch (err) { next(err); }
};

exports.deleteCustomer = async (req, res, next) => {
  try {
    await Customer.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ success: true, message: 'Customer deleted' });
  } catch (err) { next(err); }
};

exports.searchCustomers = async (req, res, next) => {
  try {
    const { q } = req.query;
    const customers = await Customer.find({
      isActive: true,
      $or: [{ name: new RegExp(q, 'i') }, { email: new RegExp(q, 'i') }, { phone: new RegExp(q, 'i') }]
    }).limit(10);
    res.json({ success: true, customers });
  } catch (err) { next(err); }
};

// Pay off due balance for a customer
exports.payDue = async (req, res, next) => {
  try {
    const { amount, note, receivedBy } = req.body;
    const customer = await Customer.findById(req.params.id);
    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });

    const payAmount = parseFloat(amount);
    if (payAmount <= 0) return res.status(400).json({ success: false, message: 'Amount must be greater than 0' });
    if (payAmount > customer.dueBalance) return res.status(400).json({ success: false, message: `Cannot pay more than due balance (${customer.dueBalance})` });

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

    // Emit real-time update
    req.app.get('io').emit('duePayment', { customerId: customer._id, dueBalance: customer.dueBalance, paidAmount: payAmount });

    res.json({ success: true, customer, message: `Due payment of ${payAmount} recorded.` });
  } catch (err) { next(err); }
};

// Get total due summary across all customers
exports.getDueSummary = async (req, res, next) => {
  try {
    const summary = await Customer.aggregate([
      { $match: { isActive: true, dueBalance: { $gt: 0 } } },
      { $group: { _id: null, totalDue: { $sum: '$dueBalance' }, count: { $sum: 1 } } }
    ]);
    const topDebtors = await Customer.find({ isActive: true, dueBalance: { $gt: 0 } })
      .sort('-dueBalance').limit(5).select('name phone dueBalance');
    res.json({ success: true, summary: summary[0] || { totalDue: 0, count: 0 }, topDebtors });
  } catch (err) { next(err); }
};
