const QuestionDistributionStrategy = require('./QuestionDistributionStrategy');

class WeightedDistributionStrategy extends QuestionDistributionStrategy {
  distribute(questionCount, facultyIds) {
    // Placeholder for future weighted distribution logic.
    return facultyIds.map((facultyId) => ({ facultyId, fromQuestion: 1, toQuestion: questionCount }));
  }
}

module.exports = WeightedDistributionStrategy;
