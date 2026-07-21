const BaseRepository = require('./BaseRepository');
const User = require('../models/entities/userModel');

class AdminRepository extends BaseRepository {
  constructor() {
    super(User);
  }

  async findByEmail(email) {
    return this.model.findOne({ email });
  }
}

module.exports = new AdminRepository();
