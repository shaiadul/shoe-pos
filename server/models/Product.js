const mongoose = require('mongoose');

const variantSchema = new mongoose.Schema({
  size: { type: String, required: true },
  color: { type: String, required: true },
  stock: { type: Number, required: true, min: 0, default: 0 },
  sku: { type: String, required: true },
  barcode: { type: String, default: '' },
});

const productSchema = new mongoose.Schema({
  name: { type: String, required: [true, 'Product name is required'], trim: true },
  brand: { type: String, required: [true, 'Brand is required'], trim: true },
  category: { type: String, required: [true, 'Category is required'], enum: ['Sneakers', 'Formal', 'Casual', 'Sports', 'Boots', 'Sandals', 'Heels', 'Kids', 'Other'] },
  description: { type: String, default: '' },
  price: { type: Number, required: [true, 'Price is required'], min: 0 },
  costPrice: { type: Number, default: 0 },
  discount: { type: Number, default: 0, min: 0, max: 100 },
  tax: { type: Number, default: 0 },
  images: [{ type: String }],
  variants: [variantSchema],
  totalStock: { type: Number, default: 0 },
  lowStockThreshold: { type: Number, default: 5 },
  isActive: { type: Boolean, default: true },
  supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier' },
  tags: [{ type: String }],
  featured: { type: Boolean, default: false },
  sold: { type: Number, default: 0 },
}, { timestamps: true });

// Auto-calculate totalStock from variants
productSchema.pre('save', function(next) {
  if (this.variants && this.variants.length > 0) {
    this.totalStock = this.variants.reduce((sum, v) => sum + v.stock, 0);
  }
  next();
});

productSchema.virtual('discountedPrice').get(function() {
  return this.price - (this.price * this.discount / 100);
});

productSchema.index({ name: 'text', brand: 'text', category: 'text' });

module.exports = mongoose.model('Product', productSchema);
