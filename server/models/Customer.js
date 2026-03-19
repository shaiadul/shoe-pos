const mongoose = require('mongoose');

const duePaymentSchema = new mongoose.Schema({
  amount: { type: Number, required: true },
  paidAt: { type: Date, default: Date.now },
  note: { type: String, default: '' },
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  receivedBy: { type: String, default: '' },
});

const customerSchema = new mongoose.Schema({
  name: { type: String, required: [true, 'Name is required'], trim: true },
  email: { type: String, unique: true, sparse: true, lowercase: true },
  phone: { type: String, trim: true },
  address: { type: String },
  city: { type: String },
  loyaltyPoints: { type: Number, default: 0 },
  totalPurchases: { type: Number, default: 0 },
  totalSpent: { type: Number, default: 0 },
  dueBalance: { type: Number, default: 0 },
  totalDue: { type: Number, default: 0 },
  totalDuePaid: { type: Number, default: 0 },
  duePayments: [duePaymentSchema],
  discount: { type: Number, default: 0 },
  notes: { type: String },
  isActive: { type: Boolean, default: true },
  birthday: { type: Date },
  joinDate: { type: Date, default: Date.now },
}, { timestamps: true });

customerSchema.index({ name: 'text', email: 'text', phone: 'text' });

module.exports = mongoose.model('Customer', customerSchema);
