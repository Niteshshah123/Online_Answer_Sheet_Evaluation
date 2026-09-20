const bcrypt = require('bcryptjs');
const AppError = require('../exceptions/AppError');
const PoiExcelAdapter = require('../adapters/excel/PoiExcelAdapter');
const StudentRepository = require('../repositories/StudentRepository');
const ExamRepository = require('../repositories/ExamRepository');
const FacultyMappingRepository = require('../repositories/FacultyMappingRepository');
const FacultyRepository = require('../repositories/FacultyRepository');
const User = require('../models/entities/userModel');
const AnswerSheetRepository = require('../repositories/AnswerSheetRepository');
const QuestionAllocationRepository = require('../repositories/QuestionAllocationRepository');
const QuestionEvaluationRepository = require('../repositories/QuestionEvaluationRepository');
const EqualDistributionStrategy = require('../strategies/distribution/EqualDistributionStrategy');
const dashboardObserver = require('../observers/DashboardObserver');
const auditObserver = require('../observers/AuditObserver');
const dashboardService = require('./DashboardService');

class ImportService {
  constructor() {
    this.excelAdapter = new PoiExcelAdapter();
    this.equalStrategy = new EqualDistributionStrategy();
  }

  async parseExcel(fileBuffer) {
    if (!fileBuffer) {
      throw new AppError('No file provided', 400);
    }
    const rows = await this.excelAdapter.read(fileBuffer);
    if (!rows || rows.length === 0) {
      throw new AppError('Excel file is empty or contains no readable data', 400);
    }
    return rows;
  }

  async importRows(rows) {
    if (!Array.isArray(rows) || rows.length === 0) {
      throw new AppError('No data rows provided for import', 400);
    }

    for (const row of rows) {
      const student = await this.ensureStudent(row);
      const exam = await this.ensureExam(row);
      const faculty = await this.ensureFacultyForRow(row, exam);
      if (faculty && !exam.courseInChargeFacultyId) {
        exam.courseInChargeFacultyId = faculty._id;
        await exam.save();
      }
      const sheetPdf = (row.answerSheetPdfLink || '').replace(/^\/+/, '');
      const keyPdf = (row.answerKeyPdfLink || '').replace(/^\/+/, '');
      const paperPdf = (row.questionPaperPdfLink || '').replace(/^\/+/, '');

      await this.ensureAnswerSheet(student._id, exam._id, sheetPdf);
      await this.ensureAnswerKey(exam, keyPdf);
      if (paperPdf && !exam.questionPaperUrl) {
        exam.questionPaperUrl = paperPdf;
        await exam.save();
      }
    }

    const exams = await ExamRepository.findAll();
    for (const exam of exams) {
      await this.ensureAllocationsForExam(exam);
      await this.ensureEvaluationsForExam(exam);
    }

    await dashboardObserver.onImportCompleted();
    await auditObserver.onEvent('IMPORT', 'ADMIN', 'Excel import completed');

    return { success: true, message: `Import completed successfully (${rows.length} records processed)` };
  }

  async importFromExcel(fileBuffer) {
    const rows = await this.parseExcel(fileBuffer);
    return this.importRows(rows);
  }

  async ensureStudent(row) {
    const regNo = String(row.registrationNumber || '').trim();
    const email = `${regNo.toLowerCase()}@ch.students.amrita.edu`;
    let student = await StudentRepository.findByRegistrationNumber(regNo);

    if (!student) {
      student = await StudentRepository.create({
        registrationNumber: regNo,
        name: row.studentName || `Student ${regNo}`,
        email: email
      });
    } else {
      if (row.studentName) student.name = row.studentName;
      student.email = email;
      await student.save();
    }

    let user = null;
    if (student.userId) {
      user = await User.findById(student.userId);
    }
    if (!user) {
      user = await User.findOne({ email });
    }

    if (!user) {
      const pass = 'std123';
      const hashedPassword = await bcrypt.hash(pass, 10);
      user = await User.create({
        role: 'STUDENT',
        email: email,
        password: hashedPassword,
        name: row.studentName || student.name
      });
    } else {
      user.email = email;
      if (row.studentName) user.name = row.studentName;
      user.role = 'STUDENT';
      await user.save();
    }

    student.email = email;
    student.userId = user._id;
    await student.save();

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

    const paperPdf = (row.questionPaperPdfLink || row.questionPaperUrl || '').replace(/^\/+/, '');
    const keyPdf = (row.answerKeyPdfLink || row.answerKeyUrl || '').replace(/^\/+/, '');

    if (!exam) {
      let rawMarks = [];
      if (Array.isArray(row.questionWeightage) && row.questionWeightage.length > 0) {
        rawMarks = row.questionWeightage;
      } else if (row.questionMarks) {
        rawMarks = String(row.questionMarks)
          .split(',')
          .map((item) => Number(item.trim()))
          .filter((value) => !Number.isNaN(value) && value > 0);
      }

      const examTypeLower = String(row.examType || '').toLowerCase();
      const defaultConvertedScale = (examTypeLower.includes('mid') || examTypeLower.includes('internal')) ? 20 : 30;

      exam = await ExamRepository.create({
        course: row.course,
        subject: row.subject,
        semester: row.semester,
        section: row.section,
        examType: row.examType,
        questionWeightage: rawMarks.length ? rawMarks : [10, 10, 10, 10, 10],
        convertedScale: row.convertedScale || defaultConvertedScale,
        questionPaperUrl: paperPdf,
        answerKeyUrl: keyPdf
      });
    } else {
      if (keyPdf && !exam.answerKeyUrl) exam.answerKeyUrl = keyPdf;
      if (paperPdf && !exam.questionPaperUrl) exam.questionPaperUrl = paperPdf;
      await exam.save();
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
      const pass = 'faculty123';
      const hashedPassword = await bcrypt.hash(pass, 10);
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
    const cleanUrl = (pdfUrl || '').replace(/^\/+/, '');
    const existing = await AnswerSheetRepository.findByStudentAndExam(studentId, examId);
    if (!existing) {
      await AnswerSheetRepository.create({ studentId, examId, pdfUrl: cleanUrl });
    } else if (cleanUrl && existing.pdfUrl !== cleanUrl) {
      existing.pdfUrl = cleanUrl;
      await existing.save();
    }
  }

  async ensureAnswerKey(exam, pdfUrl) {
    const cleanUrl = (pdfUrl || '').replace(/^\/+/, '');
    if (exam && cleanUrl && !exam.answerKeyUrl) {
      exam.answerKeyUrl = cleanUrl;
      await exam.save();
    }
  }

  async ensureAllocationsForExam(exam, forceResync = false) {
    const existingAllocations = await QuestionAllocationRepository.findByExam(exam._id);

    // Fetch all faculty teaching this subject in this semester across all sections
    let mappings = await FacultyMappingRepository.findBySubjectAndSemester(
      exam.course,
      exam.subject,
      exam.semester,
      exam.examType
    );

    if (!mappings || mappings.length === 0) {
      mappings = await FacultyMappingRepository.findByExamContext(
        exam.course,
        exam.subject,
        exam.semester,
        exam.section,
        exam.examType
      );
    }

    if (!mappings || mappings.length === 0) {
      return;
    }

    // Deduplicate and sort faculty IDs across all sections to ensure deterministic assignment
    const cohortFacultyIds = Array.from(new Set(mappings.map((mapping) => mapping.facultyId.toString())))
      .filter(Boolean)
      .sort();

    const currentAllocatedFacultyIds = Array.from(new Set(existingAllocations.map((a) => a.facultyId.toString())))
      .filter(Boolean)
      .sort();

    const isSameFacultyList =
      !forceResync &&
      existingAllocations.length > 0 &&
      currentAllocatedFacultyIds.length === cohortFacultyIds.length &&
      currentAllocatedFacultyIds.every((id, idx) => id === cohortFacultyIds[idx]);

    if (isSameFacultyList) {
      return;
    }

    // Remove old allocations when rebalancing across the new faculty list
    if (existingAllocations.length > 0) {
      for (const oldAlloc of existingAllocations) {
        await QuestionAllocationRepository.deleteById(oldAlloc._id);
      }
    }

    const allocations = this.equalStrategy.distribute(exam.questionWeightage, cohortFacultyIds);

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
    const totalQuestions = exam.questionWeightage?.length || 10;

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
        } else {
          // Re-sync faculty assignment if evaluation hasn't been evaluated or submitted yet
          const isPending =
            (existing.status === 'PENDING' || !existing.status) &&
            (existing.marksObtained === null || existing.marksObtained === undefined) &&
            !existing.evaluatorSubmitted;
          const targetFacultyIdStr = assignedFaculty.facultyId.toString();

          if (isPending && existing.facultyId?.toString() !== targetFacultyIdStr) {
            existing.facultyId = assignedFaculty.facultyId;
            existing.updatedAt = new Date();
            await existing.save();
          }
        }
      }
    }
  }

  async resyncAllAllocations() {
    const exams = await ExamRepository.findAll();
    for (const exam of exams) {
      await this.ensureAllocationsForExam(exam, true);
      await this.ensureEvaluationsForExam(exam);
    }
    await dashboardObserver.onImportCompleted();
    await auditObserver.onEvent('RESYNC', 'ADMIN', 'Re-synchronized question allocations and evaluations across all exams');
    return { success: true, message: `Allocations and pending evaluations successfully synchronized across ${exams.length} exams.` };
  }
}

module.exports = new ImportService();
