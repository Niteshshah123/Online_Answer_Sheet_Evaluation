const QuestionDistributionStrategy = require('./QuestionDistributionStrategy');

class EqualDistributionStrategy extends QuestionDistributionStrategy {
  distribute(questionCount, facultyIds) {
    if (!facultyIds || facultyIds.length === 0) {
      return [];
    }

    const allocations = [];
    const base = Math.floor(questionCount / facultyIds.length);
    const remainder = questionCount % facultyIds.length;

    let start = 1;
    facultyIds.forEach((facultyId, index) => {
      const size = base + (index < remainder ? 1 : 0);
      const end = start + size - 1;
      allocations.push({ facultyId, fromQuestion: start, toQuestion: end });
      start = end + 1;
    });

    return allocations;
  }
}

module.exports = EqualDistributionStrategy;
