const BaseRepository = require('./BaseRepository');
const Student = require('../models/entities/studentModel');

class StudentRepository extends BaseRepository {
  constructor() {
    super(Student);
  }

  async findByRegistrationNumber(registrationNumber) {
    return this.model.findOne({ registrationNumber });
  }
}

module.exports = new StudentRepository();
