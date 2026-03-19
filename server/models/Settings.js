const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  storeName: { type: String, default: 'SoleMate POS' },
  storeAddress: { type: String, default: '' },
  storePhone: { type: String, default: '' },
  storeEmail: { type: String, default: '' },
  logo: { type: String, default: '' },
  currency: { type: String, default: 'BDT' },
  currencySymbol: { type: String, default: '৳' },
  taxRate: { type: Number, default: 0 },
  taxName: { type: String, default: 'VAT' },
  lowStockThreshold: { type: Number, default: 5 },
  loyaltyPointsPerAmount: { type: Number, default: 100 },
  loyaltyDiscountPerPoint: { type: Number, default: 1 },
  receiptFooter: { type: String, default: 'Thank you for shopping with us!' },
  allowNegativeStock: { type: Boolean, default: false },
  requireCustomer: { type: Boolean, default: false },
  autoPrintReceipt: { type: Boolean, default: false },
  timezone: { type: String, default: 'Asia/Dhaka' },
}, { timestamps: true });

module.exports = mongoose.model('Settings', settingsSchema);
