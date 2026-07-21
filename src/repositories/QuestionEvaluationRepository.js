const BaseRepository = require('./BaseRepository');
const QuestionEvaluation = require('../models/entities/questionEvaluationModel');

class QuestionEvaluationRepository extends BaseRepository {
  constructor() {
    super(QuestionEvaluation);
  }

  async findByFacultyId(facultyId) {
    return this.model.find({ facultyId });
  }
}

module.exports = new QuestionEvaluationRepository();
