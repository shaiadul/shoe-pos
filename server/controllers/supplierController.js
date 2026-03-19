const Supplier = require('../models/Supplier');
const Product = require('../models/Product');

exports.getSuppliers = async (req, res, next) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    const query = { isActive: true };
    if (search) query.$or = [{ name: new RegExp(search, 'i') }, { company: new RegExp(search, 'i') }];
    const total = await Supplier.countDocuments(query);
    const suppliers = await Supplier.find(query).sort('-createdAt').skip((+page - 1) * +limit).limit(+limit);
    res.json({ success: true, count: suppliers.length, total, suppliers });
  } catch (err) { next(err); }
};

exports.getSupplier = async (req, res, next) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) return res.status(404).json({ success: false, message: 'Supplier not found' });
    const products = await Product.find({ supplier: req.params.id, isActive: true });
    res.json({ success: true, supplier, products });
  } catch (err) { next(err); }
};

exports.createSupplier = async (req, res, next) => {
  try {
    const supplier = await Supplier.create(req.body);
    res.status(201).json({ success: true, supplier });
  } catch (err) { next(err); }
};

exports.updateSupplier = async (req, res, next) => {
  try {
    const supplier = await Supplier.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!supplier) return res.status(404).json({ success: false, message: 'Supplier not found' });
    res.json({ success: true, supplier });
  } catch (err) { next(err); }
};

exports.deleteSupplier = async (req, res, next) => {
  try {
    await Supplier.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ success: true, message: 'Supplier deleted' });
  } catch (err) { next(err); }
};

exports.addPurchase = async (req, res, next) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) return res.status(404).json({ success: false, message: 'Supplier not found' });
    const { items, totalAmount, status, notes, invoiceNumber } = req.body;
    supplier.purchases.push({ items, totalAmount, status, notes, invoiceNumber });
    supplier.totalPurchased += totalAmount;

    // Update product stock
    for (const item of items) {
      if (item.product) {
        const product = await Product.findById(item.product);
        if (product) {
          const variant = product.variants.find(v => v.size === item.size);
          if (variant) { variant.stock += item.quantity; await product.save(); }
        }
      }
    }

    await supplier.save();
    res.json({ success: true, supplier });
  } catch (err) { next(err); }
};
