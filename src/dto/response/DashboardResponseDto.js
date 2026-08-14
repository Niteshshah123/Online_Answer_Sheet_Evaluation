class DashboardResponseDto {
  constructor(data) {
    this.totalExams = data.totalExams;
    this.totalStudents = data.totalStudents;
    this.totalAnswerSheets = data.totalAnswerSheets;
    this.checkedPapersCount = data.checkedPapersCount;
    this.partiallyCheckedPapersCount = data.partiallyCheckedPapersCount;
    this.notCheckedPapersCount = data.notCheckedPapersCount;
    this.facultyProgress = data.facultyProgress || [];
  }
}

module.exports = DashboardResponseDto;

