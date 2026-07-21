const BaseRepository = require('./BaseRepository');
const Exam = require('../models/entities/examModel');

class ExamRepository extends BaseRepository {
  constructor() {
    super(Exam);
  }

  async findByContext(course, subject, semester, section, examType) {
    return this.model.findOne({ course, subject, semester, section, examType });
  }
}

module.exports = new ExamRepository();
