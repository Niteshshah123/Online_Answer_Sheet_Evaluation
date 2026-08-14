const QuestionAllocationRepository = require('../repositories/QuestionAllocationRepository');
const ExamRepository = require('../repositories/ExamRepository');
const EqualDistributionStrategy = require('../strategies/distribution/EqualDistributionStrategy');
const AppError = require('../exceptions/AppError');

class DistributionService {
  constructor() {
    this.equalStrategy = new EqualDistributionStrategy();
  }

  async configureDistribution(examId, strategyType, allocations = []) {
    const exam = await ExamRepository.findById(examId);
    if (!exam) {
      throw new AppError('Exam not found', 404);
    }

    const existingAllocations = await QuestionAllocationRepository.findByExam(examId);
    await Promise.all(existingAllocations.map((item) => QuestionAllocationRepository.deleteById(item._id)));

    const facultyIds = allocations.map((item) => item.facultyId);
    let distributed = [];

    if (strategyType === 'MANUAL' && allocations.length > 0) {
      distributed = allocations;
    } else {
      distributed = this.equalStrategy.distribute(exam.questionWeightage, facultyIds);
    }

    const created = [];
    for (const allocation of distributed) {
      created.push(await QuestionAllocationRepository.create({
        examId,
        facultyId: allocation.facultyId,
        fromQuestion: allocation.fromQuestion,
        toQuestion: allocation.toQuestion,
        allocationType: strategyType || 'EQUAL'
      }));
    }

    return created;
  }
}

module.exports = new DistributionService();

