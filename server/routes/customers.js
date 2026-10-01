const express = require('express');
const router = express.Router();
const { getCustomers, getCustomer, createCustomer, updateCustomer, deleteCustomer, searchCustomers, payDue, getDueSummary } = require('../controllers/customerController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { createCustomerSchema, payDueSchema } = require('../validations/customerValidation');

router.use(protect);
router.get('/search', searchCustomers);
router.get('/due-summary', getDueSummary);
router.route('/').get(getCustomers).post(validate(createCustomerSchema), createCustomer);
router.route('/:id').get(getCustomer).put(updateCustomer).delete(deleteCustomer);
router.post('/:id/pay-due', validate(payDueSchema), payDue);

module.exports = router;
