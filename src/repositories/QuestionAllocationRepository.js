const BaseRepository = require('./BaseRepository');
const QuestionAllocation = require('../models/entities/questionAllocationModel');

class QuestionAllocationRepository extends BaseRepository {
  constructor() {
    super(QuestionAllocation);
  }

  async findByExam(examId) {
    return this.model.find({ examId });
  }

  async findByFacultyId(facultyId) {
    return this.model.find({ facultyId });
  }
}

module.exports = new QuestionAllocationRepository();
