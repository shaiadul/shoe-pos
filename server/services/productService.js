const BaseService = require('./BaseService');
const Product = require('../models/Product');
const logActivity = require('../utils/logActivity');

class ProductService extends BaseService {
  constructor() {
    super(Product);
  }

  async getProducts({ search, category, brand, minPrice, maxPrice, lowStock, page = 1, limit = 20, sort = '-createdAt' }) {
    const query = { isActive: true };
    if (search) query.$text = { $search: search };
    if (category) query.category = category;
    if (brand) query.brand = new RegExp(brand, 'i');
    if (minPrice || maxPrice) {
      query.price = {
        ...(minPrice && { $gte: +minPrice }),
        ...(maxPrice && { $lte: +maxPrice }),
      };
    }
    if (lowStock === 'true') query.totalStock = { $lte: 5 };

    const total = await this.model.countDocuments(query);
    const products = await this.model.find(query)
      .populate('supplier', 'name company')
      .sort(sort)
      .skip((+page - 1) * +limit)
      .limit(+limit);

    return {
      products,
      total,
      page: +page,
      limit: +limit,
    };
  }

  async getProduct(id) {
    const product = await this.model.findById(id).populate('supplier', 'name company phone');
    if (!product) {
      const err = new Error('Product not found');
      err.statusCode = 404;
      throw err;
    }
    return product;
  }

  async getProductByBarcode(barcode) {
    if (!barcode) {
      const err = new Error('Barcode is required');
      err.statusCode = 400;
      throw err;
    }

    const product = await this.model.findOne({
      isActive: true,
      $or: [
        { 'variants.barcode': barcode },
        { 'variants.sku': barcode },
      ],
    }).populate('supplier', 'name company');

    if (!product) {
      const err = new Error('No product found with this barcode/SKU');
      err.statusCode = 404;
      throw err;
    }

    const matchedVariant = product.variants.find(
      (v) => v.barcode === barcode || v.sku === barcode
    );

    return { product, matchedVariant };
  }

  async createProduct(data, actor, ip) {
    const product = await this.model.create(data);

    logActivity({
      action: 'PRODUCT_CREATED',
      description: `Added new product "${product.name}" (${product.brand})`,
      user: actor,
      entityType: 'Product',
      entityId: product._id,
      metadata: { brand: product.brand, price: product.price, totalStock: product.totalStock },
      ip,
    });

    return product;
  }

  async updateProduct(id, data, actor, ip) {
    const product = await this.model.findByIdAndUpdate(id, data, { new: true, runValidators: true });
    if (!product) {
      const err = new Error('Product not found');
      err.statusCode = 404;
      throw err;
    }

    logActivity({
      action: 'PRODUCT_UPDATED',
      description: `Updated product "${product.name}"`,
      user: actor,
      entityType: 'Product',
      entityId: product._id,
      metadata: { price: product.price, totalStock: product.totalStock },
      ip,
    });

    return product;
  }

  async deleteProduct(id, actor, ip) {
    const product = await this.model.findByIdAndUpdate(id, { isActive: false }, { new: true });
    if (!product) {
      const err = new Error('Product not found');
      err.statusCode = 404;
      throw err;
    }

    logActivity({
      action: 'PRODUCT_DELETED',
      description: `Deactivated product "${product.name}"`,
      user: actor,
      entityType: 'Product',
      entityId: product._id,
      ip,
    });

    return product;
  }

  async updateStock(id, variantUpdates, actor, ip) {
    const product = await this.model.findById(id);
    if (!product) {
      const err = new Error('Product not found');
      err.statusCode = 404;
      throw err;
    }

    variantUpdates.forEach(({ size, color, quantity, operation }) => {
      const variant = product.variants.find((v) => v.size === size && v.color === color);
      if (variant) {
        if (operation === 'add') variant.stock += quantity;
        else if (operation === 'subtract') variant.stock = Math.max(0, variant.stock - quantity);
        else variant.stock = quantity;
      }
    });

    await product.save();

    logActivity({
      action: 'STOCK_UPDATED',
      description: `Stock updated for "${product.name}" (Total: ${product.totalStock})`,
      user: actor,
      entityType: 'Product',
      entityId: product._id,
      metadata: { variantUpdates, totalStock: product.totalStock },
      ip,
    });

    return product;
  }

  async getLowStockProducts() {
    return this.model.find({
      isActive: true,
      $expr: { $lte: ['$totalStock', '$lowStockThreshold'] },
    }).sort('totalStock');
  }

  async getCategories() {
    return this.model.distinct('category', { isActive: true });
  }

  async getBrands() {
    return this.model.distinct('brand', { isActive: true });
  }
}

module.exports = new ProductService();
