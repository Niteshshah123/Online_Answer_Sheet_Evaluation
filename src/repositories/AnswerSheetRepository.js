const BaseRepository = require('./BaseRepository');
const AnswerSheet = require('../models/entities/answerSheetModel');

class AnswerSheetRepository extends BaseRepository {
  constructor() {
    super(AnswerSheet);
  }

  async findByStudentAndExam(studentId, examId) {
    return this.model.findOne({ studentId, examId });
  }
}

module.exports = new AnswerSheetRepository();
