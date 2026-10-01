const { z } = require('zod');

const createCustomerSchema = z.object({
  name: z.string({ required_error: 'Customer name is required' })
    .min(2, 'Customer name must be at least 2 characters')
    .trim(),
  phone: z.string({ required_error: 'Customer phone number is required' })
    .min(5, 'Please provide a valid phone number')
    .trim(),
  email: z.string().email('Please enter a valid email address').optional().or(z.literal('')),
  address: z.string().optional().default(''),
  city: z.string().optional().default(''),
  notes: z.string().optional().default(''),
});

const payDueSchema = z.object({
  amount: z.coerce.number({ required_error: 'Payment amount is required' })
    .positive('Payment amount must be greater than 0'),
  note: z.string().optional().default(''),
  receivedBy: z.string().optional().default('Staff'),
});

module.exports = {
  createCustomerSchema,
  payDueSchema,
};
