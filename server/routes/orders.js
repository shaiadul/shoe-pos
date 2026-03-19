const express = require('express');
const router = express.Router();
const { getOrders, getOrder, createOrder, updateOrderStatus, getTodayStats, getCustomerSales } = require('../controllers/orderController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/today-stats', getTodayStats);
router.get('/customer/:id', getCustomerSales);
router.route('/').get(getOrders).post(createOrder);
router.route('/:id').get(getOrder);
router.put('/:id/status', updateOrderStatus);

module.exports = router;
