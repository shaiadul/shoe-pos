const BaseService = require('./BaseService');
const Supplier = require('../models/Supplier');
const Product = require('../models/Product');
const logActivity = require('../utils/logActivity');

class SupplierService extends BaseService {
  constructor() {
    super(Supplier);
  }

  async getSuppliers({ search, page = 1, limit = 20 }) {
    const query = { isActive: true };
    if (search) {
      query.$or = [{ name: new RegExp(search, 'i') }, { company: new RegExp(search, 'i') }];
    }
    const total = await this.model.countDocuments(query);
    const suppliers = await this.model.find(query)
      .sort('-createdAt')
      .skip((+page - 1) * +limit)
      .limit(+limit);

    return { suppliers, total, page: +page, limit: +limit };
  }

  async getSupplier(id) {
    const supplier = await this.model.findById(id);
    if (!supplier) {
      const err = new Error('Supplier not found');
      err.statusCode = 404;
      throw err;
    }
    const products = await Product.find({ supplier: id, isActive: true });
    return { supplier, products };
  }

  async createSupplier(data, actor, ip) {
    const supplier = await this.model.create(data);

    logActivity({
      action: 'SUPPLIER_CREATED',
      description: `Added supplier "${supplier.name}" (${supplier.company || 'Individual'})`,
      user: actor,
      entityType: 'Supplier',
      entityId: supplier._id,
      metadata: { company: supplier.company, phone: supplier.phone },
      ip,
    });

    return supplier;
  }

  async updateSupplier(id, data, actor, ip) {
    const supplier = await this.model.findByIdAndUpdate(id, data, { new: true, runValidators: true });
    if (!supplier) {
      const err = new Error('Supplier not found');
      err.statusCode = 404;
      throw err;
    }

    logActivity({
      action: 'SUPPLIER_UPDATED',
      description: `Updated supplier details for "${supplier.name}"`,
      user: actor,
      entityType: 'Supplier',
      entityId: supplier._id,
      ip,
    });

    return supplier;
  }

  async deleteSupplier(id, actor, ip) {
    const supplier = await this.model.findByIdAndUpdate(id, { isActive: false });
    if (supplier) {
      logActivity({
        action: 'SUPPLIER_DELETED',
        description: `Deactivated supplier "${supplier.name}"`,
        user: actor,
        entityType: 'Supplier',
        entityId: supplier._id,
        ip,
      });
    }
    return supplier;
  }

  async addPurchase(id, purchaseData, actor, ip) {
    const supplier = await this.model.findById(id);
    if (!supplier) {
      const err = new Error('Supplier not found');
      err.statusCode = 404;
      throw err;
    }

    const { items, totalAmount, status, notes, invoiceNumber } = purchaseData;
    supplier.purchases.push({ items, totalAmount, status, notes, invoiceNumber });
    supplier.totalPurchased += totalAmount;

    // Update product stock
    for (const item of items) {
      if (item.product) {
        const product = await Product.findById(item.product);
        if (product) {
          const variant = product.variants.find((v) => v.size === item.size);
          if (variant) {
            variant.stock += item.quantity;
            await product.save();
          }
        }
      }
    }

    await supplier.save();

    logActivity({
      action: 'SUPPLIER_PURCHASE',
      description: `Recorded purchase order #${invoiceNumber || 'PO'} from "${supplier.name}" for $${totalAmount}`,
      user: actor,
      entityType: 'Supplier',
      entityId: supplier._id,
      metadata: { invoiceNumber, totalAmount, itemCount: items?.length },
      ip,
    });

    return supplier;
  }
}

module.exports = new SupplierService();
