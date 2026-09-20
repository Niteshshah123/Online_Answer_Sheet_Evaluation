const BaseRepository = require('./BaseRepository');
const Doubt = require('../models/entities/doubtModel');

class DoubtRepository extends BaseRepository {
  constructor() {
    super(Doubt);
  }

  async findBySheetId(sheetId) {
    return this.model.find({ sheetId }).sort({ createdAt: -1 });
  }

  async findByFacultyId(facultyId, filter = {}) {
    return this.model.find({ facultyId, ...filter }).sort({ createdAt: -1 });
  }

  async findByStudentId(studentId) {
    return this.model.find({ studentId }).sort({ createdAt: -1 });
  }
}

module.exports = new DoubtRepository();
