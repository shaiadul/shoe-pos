const express = require('express');
const router = express.Router();
const { getOrders, getOrder, createOrder, updateOrderStatus, getTodayStats, getCustomerSales } = require('../controllers/orderController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { createOrderSchema, updateOrderStatusSchema } = require('../validations/orderValidation');

router.use(protect);
router.get('/today-stats', getTodayStats);
router.get('/customer/:id', getCustomerSales);
router.route('/').get(getOrders).post(validate(createOrderSchema), createOrder);
router.route('/:id').get(getOrder);
router.put('/:id/status', validate(updateOrderStatusSchema), updateOrderStatus);

module.exports = router;
