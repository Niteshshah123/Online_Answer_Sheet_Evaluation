class ExcelRowDto {
  constructor(row) {
    this.registrationNumber = row.registrationNumber;
    this.studentName = row.studentName;
    this.course = row.course;
    this.subject = row.subject;
    this.semester = row.semester;
    this.section = row.section;
    this.examType = row.examType;
    this.answerSheetPdfLink = row.answerSheetPdfLink;
    this.answerKeyPdfLink = row.answerKeyPdfLink;
    this.questionMarks = row.questionMarks;
  }
}

module.exports = ExcelRowDto;
