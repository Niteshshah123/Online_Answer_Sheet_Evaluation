const BaseRepository = require('./BaseRepository');
const Faculty = require('../models/entities/facultyModel');

class FacultyRepository extends BaseRepository {
  constructor() {
    super(Faculty);
  }

  async findByUserId(userId) {
    return this.model.findOne({ userId });
  }

  async findByEmail(email) {
    return this.model.findOne({ email: new RegExp(`^${email}$`, 'i') });
  }
}

module.exports = new FacultyRepository();

