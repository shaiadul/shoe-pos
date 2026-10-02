const Order = require('../models/Order');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const Expense = require('../models/Expense');

class DashboardService {
  async getDashboard() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);

    const [
      todayStats,
      yesterdayStats,
      monthStats,
      lastMonthStats,
      totalProducts,
      totalCustomers,
      lowStockCount,
      dueStats,
      todayExpenseAgg,
      monthExpenseAgg,
    ] = await Promise.all([
      Order.aggregate([
        { $match: { createdAt: { $gte: today }, status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$paidAmount' }, due: { $sum: '$dueAmount' }, count: { $sum: 1 } } },
      ]),
      Order.aggregate([
        { $match: { createdAt: { $gte: yesterday, $lt: today }, status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$paidAmount' }, count: { $sum: 1 } } },
      ]),
      Order.aggregate([
        { $match: { createdAt: { $gte: thisMonth }, status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$paidAmount' }, due: { $sum: '$dueAmount' }, count: { $sum: 1 } } },
      ]),
      Order.aggregate([
        { $match: { createdAt: { $gte: lastMonth, $lte: lastMonthEnd }, status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$paidAmount' }, count: { $sum: 1 } } },
      ]),
      Product.countDocuments({ isActive: true }),
      Customer.countDocuments({ isActive: true }),
      Product.countDocuments({ isActive: true, $expr: { $lte: ['$totalStock', '$lowStockThreshold'] } }),
      Customer.aggregate([
        { $match: { isActive: true, dueBalance: { $gt: 0 } } },
        { $group: { _id: null, totalDue: { $sum: '$dueBalance' }, count: { $sum: 1 } } },
      ]),
      Expense.aggregate([
        { $match: { date: { $gte: today } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Expense.aggregate([
        { $match: { date: { $gte: thisMonth } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
    ]);

    const todayRevenue = todayStats[0]?.total || 0;
    const yesterdayRevenue = yesterdayStats[0]?.total || 0;
    const monthRevenue = monthStats[0]?.total || 0;
    const lastMonthRevenue = lastMonthStats[0]?.total || 0;
    const todayExpenses = todayExpenseAgg[0]?.total || 0;
    const monthExpenses = monthExpenseAgg[0]?.total || 0;
    const netProfitToday = todayRevenue - todayExpenses;
    const netProfitMonth = monthRevenue - monthExpenses;
    const profitMarginMonth =
      monthRevenue > 0 ? (((monthRevenue - monthExpenses) / monthRevenue) * 100).toFixed(1) : 0;

    const last7Days = await Order.aggregate([
      { $match: { createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }, status: 'completed' } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          total: { $sum: '$paidAmount' },
          due: { $sum: '$dueAmount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const last12Months = await Order.aggregate([
      { $match: { createdAt: { $gte: new Date(today.getFullYear() - 1, today.getMonth(), 1) }, status: 'completed' } },
      {
        $group: {
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
          total: { $sum: '$paidAmount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    const topProducts = await Order.aggregate([
      { $match: { status: 'completed' } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          name: { $first: '$items.name' },
          brand: { $first: '$items.brand' },
          totalSold: { $sum: '$items.quantity' },
          revenue: { $sum: '$items.total' },
        },
      },
      { $sort: { totalSold: -1 } },
      { $limit: 5 },
    ]);

    const paymentBreakdown = await Order.aggregate([
      { $match: { createdAt: { $gte: thisMonth }, status: 'completed' } },
      { $group: { _id: '$paymentMethod', total: { $sum: '$paidAmount' }, count: { $sum: 1 } } },
    ]);

    return {
      stats: {
        todayRevenue,
        yesterdayRevenue,
        todaySales: todayStats[0]?.count || 0,
        todayDue: todayStats[0]?.due || 0,
        revenueGrowth:
          yesterdayRevenue > 0
            ? (((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100).toFixed(1)
            : 0,
        monthRevenue,
        lastMonthRevenue,
        monthGrowth:
          lastMonthRevenue > 0
            ? (((monthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100).toFixed(1)
            : 0,
        monthSales: monthStats[0]?.count || 0,
        monthDue: monthStats[0]?.due || 0,
        todayExpenses,
        monthExpenses,
        netProfitToday,
        netProfitMonth,
        profitMarginMonth,
        totalProducts,
        totalCustomers,
        lowStockCount,
        totalOutstandingDue: dueStats[0]?.totalDue || 0,
        customersWithDue: dueStats[0]?.count || 0,
      },
      charts: { last7Days, last12Months, topProducts, paymentBreakdown },
    };
  }

  async getSalesReport({ period = 'daily', startDate, endDate }) {
    const start = startDate
      ? new Date(startDate)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();
    const groupFormat = period === 'daily' ? '%Y-%m-%d' : '%Y-%m';

    return Order.aggregate([
      { $match: { createdAt: { $gte: start, $lte: end }, status: 'completed' } },
      {
        $group: {
          _id: { $dateToString: { format: groupFormat, date: '$createdAt' } },
          revenue: { $sum: '$paidAmount' },
          due: { $sum: '$dueAmount' },
          orders: { $sum: 1 },
          items: { $sum: { $size: '$items' } },
          avgOrder: { $avg: '$total' },
        },
      },
      { $sort: { _id: 1 } },
    ]);
  }
}

module.exports = new DashboardService();
