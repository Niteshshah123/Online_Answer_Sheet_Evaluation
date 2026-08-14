const QuestionDistributionStrategy = require('./QuestionDistributionStrategy');

class EqualDistributionStrategy extends QuestionDistributionStrategy {
  /**
   * Sequentially distributes questions across faculty members to approximately equal mark sums.
   * @param {number[]|number} questionWeightage Array of question marks (e.g., [10, 10, 10, 5, 5, 5, 5]) or total question count.
   * @param {string[]} facultyIds Array of faculty ObjectIds.
   * @returns {Array<{facultyId: string, fromQuestion: number, toQuestion: number}>}
   */
  distribute(questionWeightage, facultyIds) {
    if (!facultyIds || facultyIds.length === 0) {
      return [];
    }

    const weights = Array.isArray(questionWeightage) && questionWeightage.length > 0
      ? questionWeightage.map((w) => Number(w) || 5)
      : Array.from({ length: Number(questionWeightage) || 10 }, () => 5);

    const questionCount = weights.length;
    const numFaculty = facultyIds.length;

    if (numFaculty === 1) {
      return [{ facultyId: facultyIds[0], fromQuestion: 1, toQuestion: questionCount }];
    }

    const totalMarks = weights.reduce((sum, w) => sum + w, 0);
    const targetMarkPerFaculty = totalMarks / numFaculty;

    const allocations = [];
    let startQuestion = 1;
    let currentFacultyIdx = 0;
    let currentSum = 0;

    for (let q = 1; q <= questionCount; q += 1) {
      const qWeight = weights[q - 1];
      const remainingFaculty = numFaculty - currentFacultyIdx - 1;
      const remainingQuestions = questionCount - q + 1;

      // If we must save remaining questions for remaining faculty members (1 question per remaining faculty minimum)
      if (remainingQuestions <= remainingFaculty && currentSum > 0) {
        allocations.push({
          facultyId: facultyIds[currentFacultyIdx],
          fromQuestion: startQuestion,
          toQuestion: q - 1
        });
        currentFacultyIdx += 1;
        startQuestion = q;
        currentSum = qWeight;
        continue;
      }

      // Check if adding this question makes currentSum exceed target and whether closing now or including q is closer to target
      if (currentFacultyIdx < numFaculty - 1 && currentSum > 0) {
        const diffWithoutQ = Math.abs(currentSum - targetMarkPerFaculty);
        const diffWithQ = Math.abs((currentSum + qWeight) - targetMarkPerFaculty);

        if (diffWithQ > diffWithoutQ) {
          // Close allocation for current faculty
          allocations.push({
            facultyId: facultyIds[currentFacultyIdx],
            fromQuestion: startQuestion,
            toQuestion: q - 1
          });
          currentFacultyIdx += 1;
          startQuestion = q;
          currentSum = qWeight;
          continue;
        }
      }

      currentSum += qWeight;
    }

    // Assign all remaining questions to the last active faculty (or current faculty)
    if (startQuestion <= questionCount) {
      const lastFacultyId = facultyIds[Math.min(currentFacultyIdx, numFaculty - 1)];
      allocations.push({
        facultyId: lastFacultyId,
        fromQuestion: startQuestion,
        toQuestion: questionCount
      });
    }

    return allocations;
  }
}

module.exports = EqualDistributionStrategy;

