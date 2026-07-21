const QuestionDistributionStrategy = require('./QuestionDistributionStrategy');

class ManualDistributionStrategy extends QuestionDistributionStrategy {
  distribute(questionCount, facultyIds, allocations = []) {
    return allocations.map((item) => ({
      facultyId: item.facultyId,
      fromQuestion: item.fromQuestion,
      toQuestion: item.toQuestion
    }));
  }
}

module.exports = ManualDistributionStrategy;
