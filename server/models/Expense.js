const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  title: { type: String, required: [true, 'Expense title is required'], trim: true },
  amount: { type: Number, required: [true, 'Amount is required'], min: 0 },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['Rent', 'Utilities', 'Salary', 'Marketing', 'Supplies', 'Transport', 'Maintenance', 'Tax', 'Other'],
  },
  date: { type: Date, default: Date.now },
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'mobile_banking', 'bank_transfer'],
    default: 'cash',
  },
  reference: { type: String, default: '' },
  notes: { type: String, default: '' },
  isRecurring: { type: Boolean, default: false },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdByName: { type: String, default: '' },
  store: { type: String, default: 'Main Store' },
}, { timestamps: true });

expenseSchema.index({ date: -1 });
expenseSchema.index({ category: 1, date: -1 });

module.exports = mongoose.model('Expense', expenseSchema);
