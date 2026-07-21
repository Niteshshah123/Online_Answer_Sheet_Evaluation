class BaseRepository {
  constructor(model) {
    this.model = model;
  }

  async create(payload) {
    return this.model.create(payload);
  }

  async findById(id) {
    return this.model.findById(id);
  }

  async findOne(filter) {
    return this.model.findOne(filter);
  }

  async findAll(filter = {}) {
    return this.model.find(filter);
  }

  async updateById(id, payload) {
    return this.model.findByIdAndUpdate(id, payload, { new: true });
  }

  async deleteById(id) {
    return this.model.findByIdAndDelete(id);
  }
}

module.exports = BaseRepository;
