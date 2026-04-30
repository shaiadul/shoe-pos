const Order = require('../models/Order');
const Product = require('../models/Product');
const Customer = require('../models/Customer');

exports.getOrders = async (req, res, next) => {
  try {
    const { status, paymentMethod, startDate, endDate, page = 1, limit = 20, search, customerId } = req.query;
    const query = {};
    if (status) query.status = status;
    if (paymentMethod) query.paymentMethod = paymentMethod;
    if (customerId) query.customer = customerId;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) { const end = new Date(endDate); end.setHours(23, 59, 59, 999); query.createdAt.$lte = end; }
    }
    if (search) query.$or = [{ orderNumber: new RegExp(search, 'i') }, { customerName: new RegExp(search, 'i') }];

    const total = await Order.countDocuments(query);
    const orders = await Order.find(query)
      .populate('customer', 'name phone email dueBalance')
      .populate('cashier', 'name')
      .sort('-createdAt')
      .skip((+page - 1) * +limit)
      .limit(+limit);

    res.json({ success: true, count: orders.length, total, pages: Math.ceil(total / +limit), page: +page, orders });
  } catch (err) { next(err); }
};

exports.getOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id).populate('customer').populate('cashier', 'name');
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    res.json({ success: true, order });
  } catch (err) { next(err); }
};

exports.createOrder = async (req, res, next) => {
  try {
    const { items, customer, customerName, paymentMethod, paymentDetails, subtotal, discountAmount, taxAmount, taxRate, taxName, total, paidAmount, notes } = req.body;

    // Calculate due
    const paid = parseFloat(paidAmount) || (paymentMethod === 'due' ? 0 : total);
    const due = Math.max(0, total - paid);

    // Validate: due orders MUST have a customer
    if (due > 0 && !customer) {
      return res.status(400).json({ success: false, message: 'A customer must be selected for due/partial payment orders.' });
    }

    // Deduct stock for each item
    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) return res.status(404).json({ success: false, message: `Product ${item.name} not found` });
      const variant = product.variants.find(v => v.size === item.size && (!item.color || v.color === item.color));
      if (!variant) return res.status(400).json({ success: false, message: `Size ${item.size} not available for ${item.name}` });
      if (variant.stock < item.quantity) return res.status(400).json({ success: false, message: `Insufficient stock for ${item.name} size ${item.size}` });
      variant.stock -= item.quantity;
      product.sold = (product.sold || 0) + item.quantity;
      await product.save();
    }

    const order = await Order.create({
      items, customer, customerName: customerName || 'Walk-in Customer',
      paymentMethod, paymentDetails, subtotal, discountAmount, taxAmount, taxRate, taxName, total,
      paidAmount: paid, dueAmount: due, notes,
      cashier: req.user._id, cashierName: req.user.name, store: req.user.store || 'Main Store',
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
        }
      });
    }

    const populated = await Order.findById(order._id).populate('customer', 'name phone dueBalance').populate('cashier', 'name');
    req.app.get('io').emit('newOrder', populated);
    res.status(201).json({ success: true, order: populated });
  } catch (err) { next(err); }
};

exports.updateOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    req.app.get('io').emit('orderUpdated', order);
    res.json({ success: true, order });
  } catch (err) { next(err); }
};

exports.getTodayStats = async (req, res, next) => {
  try {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
    const stats = await Order.aggregate([
      { $match: { createdAt: { $gte: today, $lt: tomorrow }, status: 'completed' } },
      { $group: { _id: null, totalSales: { $sum: '$paidAmount' }, totalDue: { $sum: '$dueAmount' }, count: { $sum: 1 }, avgOrder: { $avg: '$total' } } }
    ]);
    res.json({ success: true, stats: stats[0] || { totalSales: 0, totalDue: 0, count: 0, avgOrder: 0 } });
  } catch (err) { next(err); }
};

// GET all orders for a specific customer with summary
exports.getCustomerSales = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const total = await Order.countDocuments({ customer: id });
    const orders = await Order.find({ customer: id })
      .sort('-createdAt')
      .skip((+page - 1) * +limit)
      .limit(+limit);

    const summary = await Order.aggregate([
      { $match: { customer: require('mongoose').Types.ObjectId.createFromHexString(id) } },
      { $group: { _id: null, totalOrders: { $sum: 1 }, totalSpent: { $sum: '$paidAmount' }, totalDue: { $sum: '$dueAmount' }, totalValue: { $sum: '$total' } } }
    ]);

    res.json({ success: true, orders, total, pages: Math.ceil(total / +limit), summary: summary[0] || { totalOrders: 0, totalSpent: 0, totalDue: 0, totalValue: 0 } });
  } catch (err) { next(err); }
};
