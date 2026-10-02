const BaseController = require('../core/BaseController');
const supplierService = require('../services/supplierService');

class SupplierController extends BaseController {
  constructor(service = supplierService) {
    super();
    this.service = service;
  }

  async getSuppliers(req, res, next) {
    try {
      const { suppliers, total, page, limit } = await this.service.getSuppliers(req.query);
      return this.sendPaginated(res, suppliers, total, page, limit, 'suppliers');
    } catch (err) {
      next(err);
    }
  }

  async getSupplier(req, res, next) {
    try {
      const { supplier, products } = await this.service.getSupplier(req.params.id);
      return this.sendSuccess(res, { supplier, products });
    } catch (err) {
      if (err.statusCode) return this.sendError(res, err.message, err.statusCode);
      next(err);
    }
  }

  async createSupplier(req, res, next) {
    try {
      const supplier = await this.service.createSupplier(req.body, req.user, req.ip);
      return this.sendSuccess(res, { supplier }, 201);
    } catch (err) {
      next(err);
    }
  }

  async updateSupplier(req, res, next) {
    try {
      const supplier = await this.service.updateSupplier(req.params.id, req.body, req.user, req.ip);
      return this.sendSuccess(res, { supplier });
    } catch (err) {
      if (err.statusCode) return this.sendError(res, err.message, err.statusCode);
      next(err);
    }
  }

  async deleteSupplier(req, res, next) {
    try {
      await this.service.deleteSupplier(req.params.id, req.user, req.ip);
      return this.sendSuccess(res, { message: 'Supplier deleted' });
    } catch (err) {
      next(err);
    }
  }

  async addPurchase(req, res, next) {
    try {
      const supplier = await this.service.addPurchase(req.params.id, req.body, req.user, req.ip);
      return this.sendSuccess(res, { supplier });
    } catch (err) {
      if (err.statusCode) return this.sendError(res, err.message, err.statusCode);
      next(err);
    }
  }
}

const supplierController = new SupplierController();

module.exports = supplierController;
module.exports.SupplierController = SupplierController;
module.exports.getSuppliers = supplierController.getSuppliers;
module.exports.getSupplier = supplierController.getSupplier;
module.exports.createSupplier = supplierController.createSupplier;
module.exports.updateSupplier = supplierController.updateSupplier;
module.exports.deleteSupplier = supplierController.deleteSupplier;
module.exports.addPurchase = supplierController.addPurchase;
