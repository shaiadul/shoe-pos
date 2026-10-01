const { z } = require('zod');

const createExpenseSchema = z.object({
  title: z.string({ required_error: 'Expense title is required' })
    .min(2, 'Expense title must be at least 2 characters')
    .trim(),
  amount: z.coerce.number({ required_error: 'Amount is required' })
    .positive('Expense amount must be greater than 0'),
  category: z.enum(['Rent', 'Utilities', 'Salary', 'Inventory', 'Maintenance', 'Marketing', 'Supplies', 'Transport', 'Other'], {
    errorMap: () => ({ message: 'Please select a valid expense category' }),
  }),
  paymentMethod: z.enum(['cash', 'card', 'bank', 'mobile', 'other'], {
    errorMap: () => ({ message: 'Please select a valid payment method' }),
  }).optional().default('cash'),
  date: z.string().or(z.date()).optional(),
  notes: z.string().optional().default(''),
  receiptNumber: z.string().optional().default(''),
});

module.exports = {
  createExpenseSchema,
};
