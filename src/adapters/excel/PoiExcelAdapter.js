const xlsx = require('xlsx');
const ExcelAdapter = require('./ExcelAdapter');

class PoiExcelAdapter extends ExcelAdapter {
  async read(fileBuffer) {
    const workbook = xlsx.read(fileBuffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = xlsx.utils.sheet_to_json(sheet, { defval: '' });

    return rows.map((row) => ({
      registrationNumber: String(row.registrationNumber || row.RegistrationNumber || row.regNo || row.RegNo || row['Register Number'] || row['Roll Number'] || '').trim(),
      studentName: String(row.studentName || row.StudentName || row['Student Name'] || '').trim(),
      studentEmail: String(row.studentEmail || row.StudentEmail || row['Student Email'] || row.email || row.Email || '').trim(),
      course: String(row.course || row.Course || row['Course Code'] || '').trim(),
      subject: String(row.subject || row.Subject || '').trim(),
      semester: String(row.semester || row.Semester || row.sem || row.Sem || '').trim(),
      section: String(row.section || row.Section || row.sec || row.Sec || '').trim(),
      examType: String(row.examType || row.ExamType || row['Exam Type'] || '').trim(),
      questionPaperPdfLink: String(row.questionPaperPdfLink || row.QuestionPaperPdfLink || row.questionPaperUrl || row.QuestionPaperUrl || row['Question Paper PDF'] || row['Question Paper'] || '').trim(),
      answerSheetPdfLink: String(row.answerSheetPdfLink || row.AnswerSheetPdfLink || row.answerSheetUrl || row.AnswerSheetUrl || row['Answer Sheet PDF'] || row['Answer Sheet'] || '').trim(),
      answerKeyPdfLink: String(row.answerKeyPdfLink || row.AnswerKeyPdfLink || row.answerKeyUrl || row.AnswerKeyUrl || row['Answer Key PDF'] || row['Answer Key'] || '').trim(),
      questionMarks: String(row.questionMarks || row.QuestionMarks || row['Question Weightages'] || row['Question Marks'] || '').trim(),
      facultyName: String(row.facultyName || row.FacultyName || row['Faculty Name'] || '').trim(),
      facultyEmail: String(row.facultyEmail || row.FacultyEmail || row['Faculty Email'] || '').trim()
    }));
  }
}

module.exports = PoiExcelAdapter;
