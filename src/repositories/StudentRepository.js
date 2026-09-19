const BaseRepository = require('./BaseRepository');
const Student = require('../models/entities/studentModel');

class StudentRepository extends BaseRepository {
  constructor() {
    super(Student);
  }

  async findByRegistrationNumber(registrationNumber) {
    return this.model.findOne({ registrationNumber: new RegExp(`^${String(registrationNumber).trim()}$`, 'i') });
  }

  async findByEmail(email) {
    return this.model.findOne({ email: new RegExp(`^${String(email).trim()}$`, 'i') });
  }

  async findByUserId(userId) {
    return this.model.findOne({ userId });
  }

  async findByEmailOrUserId(email, userId) {
    const filters = [];
    if (email) filters.push({ email: new RegExp(`^${String(email).trim()}$`, 'i') });
    if (userId) filters.push({ userId });
    if (!filters.length) return null;
    return this.model.findOne({ $or: filters });
  }
}

module.exports = new StudentRepository();
