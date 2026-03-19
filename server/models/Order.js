const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  name: { type: String, required: true },
  brand: { type: String },
  size: { type: String, required: true },
  color: { type: String },
  sku: { type: String },
  price: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  quantity: { type: Number, required: true, min: 1 },
  total: { type: Number, required: true },
});

const orderSchema = new mongoose.Schema({
  orderNumber: { type: String, unique: true },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  customerName: { type: String, default: 'Walk-in Customer' },
  items: [orderItemSchema],
  subtotal: { type: Number, required: true },
  discountAmount: { type: Number, default: 0 },
  taxAmount: { type: Number, default: 0 },
  total: { type: Number, required: true },
  paidAmount: { type: Number, default: 0 },      // how much was actually paid now
  dueAmount: { type: Number, default: 0 },        // how much is owed (total - paidAmount)
  paymentMethod: { type: String, enum: ['cash', 'card', 'mobile_banking', 'due', 'partial'], required: true },
  paymentDetails: {
    cashPaid: { type: Number, default: 0 },
    change: { type: Number, default: 0 },
    cardRef: { type: String },
    mobileRef: { type: String },
    dueNote: { type: String },
  },
  status: { type: String, enum: ['completed', 'pending', 'refunded', 'cancelled'], default: 'completed' },
  notes: { type: String },
  cashier: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  cashierName: { type: String },
  store: { type: String, default: 'Main Store' },
}, { timestamps: true });

// Auto-generate order number
orderSchema.pre('save', async function(next) {
  if (!this.orderNumber) {
    const count = await mongoose.model('Order').countDocuments();
    const date = new Date();
    const yy = String(date.getFullYear()).slice(2);
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    this.orderNumber = `ORD-${yy}${mm}-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);
