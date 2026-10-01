const express = require('express');
const router = express.Router();
const { getExpenses, getExpense, createExpense, updateExpense, deleteExpense, getExpenseSummary } = require('../controllers/expenseController');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { createExpenseSchema } = require('../validations/expenseValidation');

router.use(protect);
router.get('/summary', getExpenseSummary);
router.route('/').get(getExpenses).post(validate(createExpenseSchema), createExpense);
router.route('/:id').get(getExpense).put(validate(createExpenseSchema.partial()), updateExpense).delete(authorize('admin'), deleteExpense);

module.exports = router;
