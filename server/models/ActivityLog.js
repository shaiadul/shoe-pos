const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  action: {
    type: String,
    required: true,
    enum: [
      'LOGIN', 'LOGOUT', 'LOGIN_FAILED',
      'ORDER_CREATED', 'ORDER_REFUNDED', 'ORDER_CANCELLED',
      'PRODUCT_CREATED', 'PRODUCT_UPDATED', 'PRODUCT_DELETED',
      'CUSTOMER_CREATED', 'CUSTOMER_UPDATED', 'CUSTOMER_DELETED',
      'CUSTOMER_DUE_PAID',
      'SUPPLIER_CREATED', 'SUPPLIER_UPDATED', 'SUPPLIER_DELETED',
      'SUPPLIER_PURCHASE',
      'USER_CREATED', 'USER_UPDATED', 'USER_DELETED', 'USER_DEACTIVATED',
      'SETTINGS_UPDATED',
      'EXPENSE_CREATED', 'EXPENSE_UPDATED', 'EXPENSE_DELETED',
      'STOCK_UPDATED',
    ],
  },
  description: { type: String, required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  userName: { type: String, default: 'System' },
  entityType: {
    type: String,
    enum: ['Order', 'Product', 'Customer', 'Supplier', 'User', 'Settings', 'Expense', 'Auth'],
  },
  entityId: { type: mongoose.Schema.Types.ObjectId },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  ip: { type: String },
}, { timestamps: true });

// Auto-expire old logs after 90 days
activityLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });
activityLogSchema.index({ action: 1, createdAt: -1 });
activityLogSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);
