const BaseController = require('../core/BaseController');
const productService = require('../services/productService');

class ProductController extends BaseController {
  constructor(service = productService) {
    super();
    this.service = service;
  }

  async getProducts(req, res, next) {
    try {
      const { products, total, page, limit } = await this.service.getProducts(req.query);
      return this.sendPaginated(res, products, total, page, limit, 'products');
    } catch (err) {
      next(err);
    }
  }

  async getProduct(req, res, next) {
    try {
      const product = await this.service.getProduct(req.params.id);
      return this.sendSuccess(res, { product });
    } catch (err) {
      if (err.statusCode) return this.sendError(res, err.message, err.statusCode);
      next(err);
    }
  }

  async getProductByBarcode(req, res, next) {
    try {
      const { product, matchedVariant } = await this.service.getProductByBarcode(req.params.barcode);
      return this.sendSuccess(res, { product, matchedVariant });
    } catch (err) {
      if (err.statusCode) return this.sendError(res, err.message, err.statusCode);
      next(err);
    }
  }

  async createProduct(req, res, next) {
    try {
      const product = await this.service.createProduct(req.body, req.user, req.ip);
      this.getIo(req)?.emit('productCreated', product);
      return this.sendSuccess(res, { product }, 201);
    } catch (err) {
      next(err);
    }
  }

  async updateProduct(req, res, next) {
    try {
      const product = await this.service.updateProduct(req.params.id, req.body, req.user, req.ip);
      this.getIo(req)?.emit('productUpdated', product);
      return this.sendSuccess(res, { product });
    } catch (err) {
      if (err.statusCode) return this.sendError(res, err.message, err.statusCode);
      next(err);
    }
  }

  async deleteProduct(req, res, next) {
    try {
      await this.service.deleteProduct(req.params.id, req.user, req.ip);
      return this.sendSuccess(res, { message: 'Product deleted' });
    } catch (err) {
      if (err.statusCode) return this.sendError(res, err.message, err.statusCode);
      next(err);
    }
  }

  async updateStock(req, res, next) {
    try {
      const { variantUpdates } = req.body;
      const product = await this.service.updateStock(req.params.id, variantUpdates, req.user, req.ip);
      this.getIo(req)?.emit('stockUpdated', { productId: product._id, totalStock: product.totalStock });
      return this.sendSuccess(res, { product });
    } catch (err) {
      if (err.statusCode) return this.sendError(res, err.message, err.statusCode);
      next(err);
    }
  }

  async getLowStockProducts(req, res, next) {
    try {
      const products = await this.service.getLowStockProducts();
      return this.sendSuccess(res, { count: products.length, products });
    } catch (err) {
      next(err);
    }
  }

  async getCategories(req, res, next) {
    try {
      const categories = await this.service.getCategories();
      return this.sendSuccess(res, { categories });
    } catch (err) {
      next(err);
    }
  }

  async getBrands(req, res, next) {
    try {
      const brands = await this.service.getBrands();
      return this.sendSuccess(res, { brands });
    } catch (err) {
      next(err);
    }
  }
}

const productController = new ProductController();

module.exports = productController;
module.exports.ProductController = ProductController;
module.exports.getProducts = productController.getProducts;
module.exports.getProduct = productController.getProduct;
module.exports.getProductByBarcode = productController.getProductByBarcode;
module.exports.createProduct = productController.createProduct;
module.exports.updateProduct = productController.updateProduct;
module.exports.deleteProduct = productController.deleteProduct;
module.exports.updateStock = productController.updateStock;
module.exports.getLowStockProducts = productController.getLowStockProducts;
module.exports.getCategories = productController.getCategories;
module.exports.getBrands = productController.getBrands;
