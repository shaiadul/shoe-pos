const { z } = require('zod');

const variantSchema = z.object({
  size: z.string({ required_error: 'Shoe size is required' }).min(1, 'Shoe size cannot be empty'),
  color: z.string({ required_error: 'Color is required' }).min(1, 'Color cannot be empty'),
  stock: z.coerce.number({ required_error: 'Stock is required' }).int('Stock must be an integer').min(0, 'Stock cannot be negative'),
  sku: z.string({ required_error: 'SKU is required' }).min(1, 'SKU cannot be empty').trim(),
  barcode: z.string().optional().default(''),
});

const createProductSchema = z.object({
  name: z.string({ required_error: 'Product name is required' }).min(2, 'Product name must be at least 2 characters').trim(),
  brand: z.string({ required_error: 'Brand is required' }).min(1, 'Brand is required').trim(),
  category: z.enum(['Sneakers', 'Formal', 'Casual', 'Sports', 'Boots', 'Sandals', 'Heels', 'Kids', 'Other'], {
    errorMap: () => ({ message: 'Please select a valid shoe category' }),
  }),
  description: z.string().optional().default(''),
  price: z.coerce.number({ required_error: 'Price is required' }).positive('Price must be greater than 0'),
  costPrice: z.coerce.number().min(0, 'Cost price cannot be negative').optional().default(0),
  discount: z.coerce.number().min(0, 'Discount cannot be negative').max(100, 'Discount cannot exceed 100%').optional().default(0),
  tax: z.coerce.number().min(0, 'Tax cannot be negative').optional().default(0),
  images: z.array(z.string()).optional().default([]),
  variants: z.array(variantSchema).min(1, 'Product must have at least one size variant with stock'),
  lowStockThreshold: z.coerce.number().int().min(0).optional().default(5),
  supplier: z.string().optional().nullable(),
  tags: z.array(z.string()).optional(),
  featured: z.boolean().optional().default(false),
});

const updateStockSchema = z.object({
  variantUpdates: z.array(z.object({
    size: z.string({ required_error: 'Size is required' }),
    color: z.string().optional(),
    quantity: z.coerce.number({ required_error: 'Quantity is required' }).int().min(0, 'Quantity cannot be negative'),
    operation: z.enum(['add', 'subtract', 'set'], {
      errorMap: () => ({ message: 'Operation must be add, subtract, or set' }),
    }).optional().default('set'),
  })).min(1, 'At least one variant update must be provided'),
});

module.exports = {
  createProductSchema,
  updateStockSchema,
  variantSchema,
};
