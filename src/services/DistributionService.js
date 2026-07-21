const QuestionAllocationRepository = require('../repositories/QuestionAllocationRepository');
const strategyFactory = require('../factories/StrategyFactory');
const AppError = require('../exceptions/AppError');

class DistributionService {
  async configureDistribution(examId, strategyType, allocations = []) {
    const existingAllocations = await QuestionAllocationRepository.findByExam(examId);
    await Promise.all(existingAllocations.map((item) => QuestionAllocationRepository.deleteById(item._id)));

    const strategy = strategyFactory.create(strategyType);
    const questionCount = 10;
    const facultyIds = allocations.map((item) => item.facultyId);
    const distributed = strategyType === 'MANUAL'
      ? strategy.distribute(questionCount, facultyIds, allocations)
      : strategy.distribute(questionCount, facultyIds);

    const created = [];
    for (const allocation of distributed) {
      created.push(await QuestionAllocationRepository.create({
        examId,
        facultyId: allocation.facultyId,
        fromQuestion: allocation.fromQuestion,
        toQuestion: allocation.toQuestion,
        allocationType: strategyType
      }));
    }

    return created;
  }
}

module.exports = new DistributionService();
