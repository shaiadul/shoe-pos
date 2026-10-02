/**
 * BaseService
 * Common data-access and business operations for all domain services.
 */
class BaseService {
  constructor(model) {
    this.model = model;
  }

  async findById(id, populate = '', select = '') {
    let query = this.model.findById(id);
    if (populate) query = query.populate(populate);
    if (select) query = query.select(select);
    return query;
  }

  async findOne(filter = {}, populate = '', select = '') {
    let query = this.model.findOne(filter);
    if (populate) query = query.populate(populate);
    if (select) query = query.select(select);
    return query;
  }

  async find(filter = {}, sort = '-createdAt', skip = 0, limit = 20, populate = '') {
    let query = this.model.find(filter).sort(sort).skip(skip).limit(limit);
    if (populate) query = query.populate(populate);
    return query;
  }

  async count(filter = {}) {
    return this.model.countDocuments(filter);
  }

  async create(data) {
    return this.model.create(data);
  }

  async updateById(id, data, options = { new: true, runValidators: true }) {
    return this.model.findByIdAndUpdate(id, data, options);
  }

  async deleteById(id) {
    return this.model.findByIdAndDelete(id);
  }
}

module.exports = BaseService;
