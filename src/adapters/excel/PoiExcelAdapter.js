const xlsx = require('xlsx');
const ExcelAdapter = require('./ExcelAdapter');

class PoiExcelAdapter extends ExcelAdapter {
  async read(fileBuffer) {
    const workbook = xlsx.read(fileBuffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = xlsx.utils.sheet_to_json(sheet, { defval: '' });

    return rows.map((row) => ({
      registrationNumber: row.registrationNumber || row.RegistrationNumber || '',
      studentName: row.studentName || row.StudentName || '',
      studentEmail: row.studentEmail || row.StudentEmail || '',
      course: row.course || row.Course || '',
      subject: row.subject || row.Subject || '',
      semester: row.semester || row.Semester || '',
      section: row.section || row.Section || '',
      examType: row.examType || row.ExamType || '',
      answerSheetPdfLink: row.answerSheetPdfLink || row.AnswerSheetPdfLink || '',
      answerKeyPdfLink: row.answerKeyPdfLink || row.AnswerKeyPdfLink || '',
      questionMarks: row.questionMarks || row.QuestionMarks || '',
      facultyName: row.facultyName || row.FacultyName || '',
      facultyEmail: row.facultyEmail || row.FacultyEmail || ''
    }));
  }
}

module.exports = PoiExcelAdapter;
