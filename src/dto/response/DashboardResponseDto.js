class DashboardResponseDto {
  constructor(data) {
    this.totalExams = data.totalExams;
    this.totalStudents = data.totalStudents;
    this.checkedPapers = data.checkedPapers;
    this.remainingPapers = data.remainingPapers;
    this.lockedEvaluations = data.lockedEvaluations;
    this.submittedEvaluations = data.submittedEvaluations;
  }
}

module.exports = DashboardResponseDto;
