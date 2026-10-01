const Product = require('../models/Product');
const logActivity = require('../utils/logActivity');

exports.getProducts = async (req, res, next) => {
  try {
    const { search, category, brand, minPrice, maxPrice, lowStock, page = 1, limit = 20, sort = '-createdAt' } = req.query;
    const query = { isActive: true };
    if (search) query.$text = { $search: search };
    if (category) query.category = category;
    if (brand) query.brand = new RegExp(brand, 'i');
    if (minPrice || maxPrice) query.price = { ...(minPrice && { $gte: +minPrice }), ...(maxPrice && { $lte: +maxPrice }) };
    if (lowStock === 'true') query.totalStock = { $lte: 5 };

    const total = await Product.countDocuments(query);
    const products = await Product.find(query)
      .populate('supplier', 'name company')
      .sort(sort)
      .skip((+page - 1) * +limit)
      .limit(+limit);

    res.json({ success: true, count: products.length, total, pages: Math.ceil(total / +limit), page: +page, products });
  } catch (err) { next(err); }
};

exports.getProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id).populate('supplier', 'name company phone');
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, product });
  } catch (err) { next(err); }
};

exports.getProductByBarcode = async (req, res, next) => {
  try {
    const { barcode } = req.params;
    if (!barcode) return res.status(400).json({ success: false, message: 'Barcode is required' });

    const product = await Product.findOne({
      isActive: true,
      $or: [
        { 'variants.barcode': barcode },
        { 'variants.sku': barcode },
      ],
    }).populate('supplier', 'name company');

    if (!product) {
      return res.status(404).json({ success: false, message: 'No product found with this barcode/SKU' });
    }

    const matchedVariant = product.variants.find(
      v => v.barcode === barcode || v.sku === barcode
    );

    res.json({ success: true, product, matchedVariant });
  } catch (err) { next(err); }
};

exports.createProduct = async (req, res, next) => {
  try {
    const product = await Product.create(req.body);
    req.app.get('io').emit('productCreated', product);

    logActivity({
      action: 'PRODUCT_CREATED',
      description: `Added new product "${product.name}" (${product.brand})`,
      user: req.user,
      entityType: 'Product',
      entityId: product._id,
      metadata: { brand: product.brand, price: product.price, totalStock: product.totalStock },
      ip: req.ip,
    });

    res.status(201).json({ success: true, product });
  } catch (err) { next(err); }
};

exports.updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    req.app.get('io').emit('productUpdated', product);

    logActivity({
      action: 'PRODUCT_UPDATED',
      description: `Updated product "${product.name}"`,
      user: req.user,
      entityType: 'Product',
      entityId: product._id,
      metadata: { price: product.price, totalStock: product.totalStock },
      ip: req.ip,
    });

    res.json({ success: true, product });
  } catch (err) { next(err); }
};

exports.deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    logActivity({
      action: 'PRODUCT_DELETED',
      description: `Deactivated product "${product.name}"`,
      user: req.user,
      entityType: 'Product',
      entityId: product._id,
      ip: req.ip,
    });

    res.json({ success: true, message: 'Product deleted' });
  } catch (err) { next(err); }
};

exports.updateStock = async (req, res, next) => {
  try {
    const { variantUpdates } = req.body; // [{ size, color, quantity, operation: 'add'|'subtract' }]
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    
    variantUpdates.forEach(({ size, color, quantity, operation }) => {
      const variant = product.variants.find(v => v.size === size && v.color === color);
      if (variant) {
        if (operation === 'add') variant.stock += quantity;
        else if (operation === 'subtract') variant.stock = Math.max(0, variant.stock - quantity);
        else variant.stock = quantity;
      }
    });
    
    await product.save();
    req.app.get('io').emit('stockUpdated', { productId: product._id, totalStock: product.totalStock });

    logActivity({
      action: 'STOCK_UPDATED',
      description: `Stock updated for "${product.name}" (Total: ${product.totalStock})`,
      user: req.user,
      entityType: 'Product',
      entityId: product._id,
      metadata: { variantUpdates, totalStock: product.totalStock },
      ip: req.ip,
    });

    res.json({ success: true, product });
  } catch (err) { next(err); }
};

exports.getLowStockProducts = async (req, res, next) => {
  try {
    const products = await Product.find({ isActive: true, $expr: { $lte: ['$totalStock', '$lowStockThreshold'] } }).sort('totalStock');
    res.json({ success: true, count: products.length, products });
  } catch (err) { next(err); }
};

exports.getCategories = async (req, res, next) => {
  try {
    const categories = await Product.distinct('category', { isActive: true });
    res.json({ success: true, categories });
  } catch (err) { next(err); }
};

exports.getBrands = async (req, res, next) => {
  try {
    const brands = await Product.distinct('brand', { isActive: true });
    res.json({ success: true, brands });
  } catch (err) { next(err); }
};
