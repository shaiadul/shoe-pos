import { z } from 'zod';

/**
 * Validates data against a Zod schema.
 * Returns { success: true, data } or { success: false, errors: { [field]: string }, firstMessage: string }
 */
export const validateWithZod = (schema, data) => {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data, errors: {} };
  }

  const errors = {};
  const issues = result.error.issues || [];
  issues.forEach((issue) => {
    const field = issue.path.join('.') || 'general';
    if (!errors[field]) {
      errors[field] = issue.message;
    }
  });

  const firstMessage = issues[0]?.message || 'Please correct the highlighted errors.';
  return {
    success: false,
    errors,
    firstMessage,
  };
};

/* ── Client Validation Schemas ──────────────────────────────── */

export const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const customerSchema = z.object({
  name: z.string().min(2, 'Customer name must be at least 2 characters').trim(),
  phone: z.string().min(5, 'Phone number must be at least 5 digits').trim(),
  email: z.string().email('Please enter a valid email address').optional().or(z.literal('')),
  address: z.string().optional(),
  city: z.string().optional(),
  notes: z.string().optional(),
});

export const expenseSchema = z.object({
  title: z.string().min(2, 'Expense title must be at least 2 characters').trim(),
  amount: z.coerce.number().positive('Amount must be greater than 0'),
  category: z.string().min(1, 'Please select a category'),
  paymentMethod: z.string().optional().default('cash'),
  date: z.string().optional(),
  receiptNumber: z.string().optional(),
  notes: z.string().optional(),
});

export const supplierSchema = z.object({
  name: z.string().min(2, 'Supplier name must be at least 2 characters').trim(),
  phone: z.string().min(5, 'Phone number must be at least 5 digits').trim(),
  company: z.string().optional(),
  email: z.string().email('Please enter a valid email address').optional().or(z.literal('')),
  address: z.string().optional(),
});
