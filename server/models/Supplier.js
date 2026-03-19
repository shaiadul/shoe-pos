const mongoose = require('mongoose');

const purchaseItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  productName: { type: String },
  size: { type: String },
  quantity: { type: Number },
  costPrice: { type: Number },
  total: { type: Number },
});

const purchaseSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  items: [purchaseItemSchema],
  totalAmount: { type: Number },
  status: { type: String, enum: ['pending', 'received', 'partial'], default: 'received' },
  notes: { type: String },
  invoiceNumber: { type: String },
});

const supplierSchema = new mongoose.Schema({
  name: { type: String, required: [true, 'Supplier name is required'], trim: true },
  company: { type: String, trim: true },
  email: { type: String, lowercase: true },
  phone: { type: String },
  address: { type: String },
  city: { type: String },
  country: { type: String, default: 'Bangladesh' },
  brands: [{ type: String }],
  purchases: [purchaseSchema],
  totalPurchased: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  notes: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Supplier', supplierSchema);
