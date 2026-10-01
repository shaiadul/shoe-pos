const { z } = require('zod');

const loginSchema = z.object({
  email: z.string({ required_error: 'Email is required' })
    .email('Please enter a valid email address')
    .trim()
    .toLowerCase(),
  password: z.string({ required_error: 'Password is required' })
    .min(1, 'Password cannot be empty'),
});

const registerSchema = z.object({
  name: z.string({ required_error: 'Name is required' })
    .min(2, 'Name must be at least 2 characters')
    .trim(),
  email: z.string({ required_error: 'Email is required' })
    .email('Please enter a valid email address')
    .trim()
    .toLowerCase(),
  password: z.string({ required_error: 'Password is required' })
    .min(6, 'Password must be at least 6 characters'),
  role: z.enum(['admin', 'cashier', 'manager'], {
    errorMap: () => ({ message: 'Role must be either admin, cashier, or manager' }),
  }).optional().default('cashier'),
  phone: z.string().optional().default(''),
  store: z.string().optional().default('Main Store'),
});

const changePasswordSchema = z.object({
  currentPassword: z.string({ required_error: 'Current password is required' })
    .min(1, 'Current password cannot be empty'),
  newPassword: z.string({ required_error: 'New password is required' })
    .min(6, 'New password must be at least 6 characters'),
});

const updateProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').trim().optional(),
  phone: z.string().optional(),
  avatar: z.string().optional(),
});

module.exports = {
  loginSchema,
  registerSchema,
  changePasswordSchema,
  updateProfileSchema,
};
