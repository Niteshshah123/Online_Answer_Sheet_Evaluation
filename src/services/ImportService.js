const bcrypt = require('bcryptjs');
const AppError = require('../exceptions/AppError');
const PoiExcelAdapter = require('../adapters/excel/PoiExcelAdapter');
const StudentRepository = require('../repositories/StudentRepository');
const ExamRepository = require('../repositories/ExamRepository');
const FacultyMappingRepository = require('../repositories/FacultyMappingRepository');
const FacultyRepository = require('../repositories/FacultyRepository');
const User = require('../models/entities/userModel');
const AnswerSheetRepository = require('../repositories/AnswerSheetRepository');
const AnswerKeyRepository = require('../repositories/AnswerKeyRepository');
const QuestionAllocationRepository = require('../repositories/QuestionAllocationRepository');
const QuestionEvaluationRepository = require('../repositories/QuestionEvaluationRepository');
const strategyFactory = require('../factories/StrategyFactory');
const dashboardObserver = require('../observers/DashboardObserver');
const auditObserver = require('../observers/AuditObserver');
const dashboardService = require('./DashboardService');

class ImportService {
  constructor() {
    this.excelAdapter = new PoiExcelAdapter();
  }

  async importFromExcel(fileBuffer) {
    if (!fileBuffer) {
      throw new AppError('No file provided', 400);
    }

    const rows = await this.excelAdapter.read(fileBuffer);

    for (const row of rows) {
      const student = await this.ensureStudent(row);
      const exam = await this.ensureExam(row);
      await this.ensureFacultyForRow(row, exam);
      await this.ensureAnswerSheet(student._id, exam._id, row.answerSheetPdfLink);
      await this.ensureAnswerKey(exam._id, row.answerKeyPdfLink);
    }

    const exams = await ExamRepository.findAll();
    for (const exam of exams) {
      await this.ensureAllocationsForExam(exam);
      await this.ensureEvaluationsForExam(exam);
    }

    await dashboardObserver.onImportCompleted();
    await auditObserver.onEvent('IMPORT', 'ADMIN', 'Excel import completed');

    return { success: true, message: 'Import completed successfully' };
  }

  async ensureStudent(row) {
    let student = await StudentRepository.findByRegistrationNumber(row.registrationNumber);
    if (!student) {
      student = await StudentRepository.create({
        registrationNumber: row.registrationNumber,
        name: row.studentName
      });
    }
    return student;
  }

  async ensureExam(row) {
    let exam = await ExamRepository.findByContext(
      row.course,
      row.subject,
      row.semester,
      row.section,
      row.examType
    );

    if (!exam) {
      const rawMarks = String(row.questionMarks || '')
        .split(',')
        .map((item) => Number(item.trim()))
        .filter((value) => !Number.isNaN(value));

      exam = await ExamRepository.create({
        course: row.course,
        subject: row.subject,
        semester: row.semester,
        section: row.section,
        examType: row.examType,
        questionWeightage: rawMarks,
        answerKeyUrl: row.answerKeyPdfLink || ''
      });
    }

    return exam;
  }

  async ensureFacultyForRow(row, exam) {
    const facultyName = String(row.facultyName || '').trim();
    const facultyEmail = String(row.facultyEmail || '').trim();

    if (!facultyName || !facultyEmail) {
      return null;
    }

    let user = await User.findOne({ email: facultyEmail });
    if (!user) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      user = await User.create({
        role: 'FACULTY',
        email: facultyEmail,
        password: hashedPassword,
        name: facultyName
      });
    }

    let faculty = await FacultyRepository.findOne({ email: facultyEmail });
    if (!faculty) {
      faculty = await FacultyRepository.create({
        userId: user._id,
        name: facultyName,
        email: facultyEmail
      });
    }

    const existingMapping = await FacultyMappingRepository.findOne({
      course: exam.course,
      subject: exam.subject,
      semester: exam.semester,
      section: exam.section,
      examType: exam.examType,
      facultyId: faculty._id
    });

    if (!existingMapping) {
      await FacultyMappingRepository.create({
        course: exam.course,
        subject: exam.subject,
        semester: exam.semester,
        section: exam.section,
        examType: exam.examType,
        facultyId: faculty._id
      });
    }

    return faculty;
  }

  async ensureAnswerSheet(studentId, examId, pdfUrl) {
    const existing = await AnswerSheetRepository.findByStudentAndExam(studentId, examId);
    if (!existing) {
      await AnswerSheetRepository.create({ studentId, examId, pdfUrl });
    }
  }

  async ensureAnswerKey(examId, pdfUrl) {
    const existing = await AnswerKeyRepository.findByExamId(examId);
    if (!existing) {
      await AnswerKeyRepository.create({ examId, pdfUrl });
    }
  }

  async ensureAllocationsForExam(exam) {
    const existingAllocations = await QuestionAllocationRepository.findByExam(exam._id);
    if (existingAllocations.length > 0) {
      return;
    }

    const mappings = await FacultyMappingRepository.findByExamContext(
      exam.course,
      exam.subject,
      exam.semester,
      exam.section,
      exam.examType
    );

    if (!mappings || mappings.length === 0) {
      return;
    }

    const facultyIds = mappings.map((mapping) => mapping.facultyId);
    const questionCount = exam.questionWeightage.length || 10;
    const strategy = strategyFactory.create('EQUAL');
    const allocations = strategy.distribute(questionCount, facultyIds);

    for (const allocation of allocations) {
      await QuestionAllocationRepository.create({
        examId: exam._id,
        facultyId: allocation.facultyId,
        fromQuestion: allocation.fromQuestion,
        toQuestion: allocation.toQuestion,
        allocationType: 'EQUAL'
      });
    }
  }

  async ensureEvaluationsForExam(exam) {
    const answerSheets = await AnswerSheetRepository.findAll({ examId: exam._id });
    const allocations = await QuestionAllocationRepository.findByExam(exam._id);
    const totalQuestions = exam.questionWeightage.length || 10;

    for (const sheet of answerSheets) {
      for (let q = 1; q <= totalQuestions; q += 1) {
        const assignedFaculty = allocations.find((allocation) => q >= allocation.fromQuestion && q <= allocation.toQuestion);
        if (!assignedFaculty) {
          continue;
        }

        const existing = await QuestionEvaluationRepository.findOne({ sheetId: sheet._id, questionNumber: q });
        if (!existing) {
          await QuestionEvaluationRepository.create({
            sheetId: sheet._id,
            questionNumber: q,
            marksObtained: null,
            review: null,
            status: 'PENDING',
            facultyId: assignedFaculty.facultyId
          });
        }
      }
    }
  }
}

module.exports = new ImportService();
