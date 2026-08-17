const XLSX = require('xlsx');

class AUMSExportAdapter {
  /**
   * Generates an Excel workbook buffer in AUMS upload format.
   * @param {Array} rows - Array of student report objects.
   * @returns {Buffer} Excel file buffer.
   */
  generateAUMSWorkbook(rows) {
    const data = rows.map((r) => ({
      'Register Number': r.registrationNumber,
      'Student Name': r.studentName,
      'Course Code': r.course,
      'Subject': r.subject,
      'Semester': r.semester,
      'Section': r.section,
      'Exam Type': r.examType,
      'Raw Total (50)': r.rawMarks,
      'Converted Score': r.convertedMarks,
      'Evaluation Status': r.status
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    
    // Set column widths for readability
    worksheet['!cols'] = [
      { wch: 22 }, // Reg No
      { wch: 24 }, // Student Name
      { wch: 12 }, // Course
      { wch: 16 }, // Subject
      { wch: 10 }, // Semester
      { wch: 10 }, // Section
      { wch: 14 }, // Exam Type
      { wch: 16 }, // Raw Total
      { wch: 18 }, // Converted Score
      { wch: 18 }  // Status
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'AUMS Score Import');

    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }
}

module.exports = new AUMSExportAdapter();
