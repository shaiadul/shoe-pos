const { z } = require('zod');

const createSupplierSchema = z.object({
  name: z.string({ required_error: 'Supplier contact name is required' })
    .min(2, 'Name must be at least 2 characters')
    .trim(),
  company: z.string().optional().default(''),
  phone: z.string({ required_error: 'Phone number is required' })
    .min(5, 'Please provide a valid phone number')
    .trim(),
  email: z.string().email('Please enter a valid email address').optional().or(z.literal('')),
  address: z.string().optional().default(''),
});

const addPurchaseSchema = z.object({
  items: z.array(z.object({
    product: z.string().optional(),
    name: z.string({ required_error: 'Product name is required' }).min(1),
    size: z.string({ required_error: 'Shoe size is required' }).min(1),
    quantity: z.coerce.number().int().positive('Quantity must be greater than 0'),
    costPrice: z.coerce.number().min(0, 'Cost price cannot be negative'),
    total: z.coerce.number().min(0).optional(),
  })).min(1, 'Purchase order must have at least one shoe item'),
  totalAmount: z.coerce.number().positive('Total purchase amount must be greater than 0'),
  status: z.enum(['received', 'pending', 'partial']).optional().default('received'),
  notes: z.string().optional().default(''),
  invoiceNumber: z.string().optional().default(''),
});

module.exports = {
  createSupplierSchema,
  addPurchaseSchema,
};
