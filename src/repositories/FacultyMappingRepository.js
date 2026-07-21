const BaseRepository = require('./BaseRepository');
const FacultyMapping = require('../models/entities/facultyMappingModel');

class FacultyMappingRepository extends BaseRepository {
  constructor() {
    super(FacultyMapping);
  }

  async findByExamContext(course, subject, semester, section, examType) {
    return this.model.find({ course, subject, semester, section, examType });
  }
}

module.exports = new FacultyMappingRepository();
