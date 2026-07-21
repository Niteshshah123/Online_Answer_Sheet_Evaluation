const BaseRepository = require('./BaseRepository');
const AnswerKey = require('../models/entities/answerKeyModel');

class AnswerKeyRepository extends BaseRepository {
  constructor() {
    super(AnswerKey);
  }

  async findByExamId(examId) {
    return this.model.findOne({ examId });
  }
}

module.exports = new AnswerKeyRepository();
