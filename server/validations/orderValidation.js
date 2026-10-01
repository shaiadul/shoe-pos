const { z } = require('zod');

const orderItemSchema = z.object({
  product: z.string({ required_error: 'Product ID is required' }),
  name: z.string({ required_error: 'Product name is required' }),
  brand: z.string().optional().default(''),
  size: z.string({ required_error: 'Shoe size is required' }),
  color: z.string().optional().default(''),
  sku: z.string().optional().default(''),
  quantity: z.coerce.number({ required_error: 'Quantity is required' }).int().positive('Item quantity must be at least 1'),
  price: z.coerce.number({ required_error: 'Price is required' }).min(0, 'Item price cannot be negative'),
  discount: z.coerce.number().min(0).max(100).optional().default(0),
  total: z.coerce.number().min(0).optional(),
});

const createOrderSchema = z.object({
  items: z.array(orderItemSchema).min(1, 'Cannot create an empty order. Please add shoes to the cart.'),
  customer: z.string().optional().nullable(),
  customerName: z.string().optional().default('Walk-in Customer'),
  paymentMethod: z.enum(['cash', 'card', 'mobile_banking', 'due', 'partial'], {
    errorMap: () => ({ message: 'Please select a valid payment method' }),
  }),
  paymentDetails: z.record(z.any()).optional().default({}),
  subtotal: z.coerce.number().min(0, 'Subtotal cannot be negative'),
  discountAmount: z.coerce.number().min(0).optional().default(0),
  taxAmount: z.coerce.number().min(0).optional().default(0),
  taxRate: z.coerce.number().min(0).optional().default(0),
  taxName: z.string().optional().default('Tax'),
  total: z.coerce.number().min(0, 'Order total cannot be negative'),
  paidAmount: z.coerce.number().min(0, 'Paid amount cannot be negative').optional(),
  notes: z.string().optional().default(''),
});

const updateOrderStatusSchema = z.object({
  status: z.enum(['completed', 'refunded', 'cancelled', 'pending'], {
    errorMap: () => ({ message: 'Status must be completed, refunded, cancelled, or pending' }),
  }),
});

module.exports = {
  createOrderSchema,
  updateOrderStatusSchema,
};
