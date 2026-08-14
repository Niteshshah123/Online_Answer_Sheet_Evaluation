const bcrypt = require('bcryptjs');
const AppError = require('../exceptions/AppError');
const User = require('../models/entities/userModel');
const StudentRepository = require('../repositories/StudentRepository');
const AnswerSheetRepository = require('../repositories/AnswerSheetRepository');
const ExamRepository = require('../repositories/ExamRepository');
const QuestionEvaluationRepository = require('../repositories/QuestionEvaluationRepository');
const FacultyRepository = require('../repositories/FacultyRepository');
const { signToken } = require('../security/jwt');
const AuthResponseDto = require('../dto/response/AuthResponseDto');

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function buildReportSummary(evaluations, questionWeightage = []) {
  const rows = [];
  let fullMarks = 0;
  let marksObtained = 0;

  const ordered = [...evaluations].sort((a, b) => a.questionNumber - b.questionNumber);

  ordered.forEach((evaluation) => {
    const maxMark = questionWeightage[evaluation.questionNumber - 1] ?? null;
    if (maxMark != null) {
      fullMarks += Number(maxMark);
    }

    if (evaluation.marksObtained != null) {
      marksObtained += Number(evaluation.marksObtained);
    }

    rows.push({
      questionNumber: evaluation.questionNumber,
      maxMark,
      marksObtained: evaluation.marksObtained ?? null,
      review: evaluation.review || '',
      facultyName: evaluation.facultyName || '',
      status: evaluation.status || 'PENDING'
    });
  });

  return { fullMarks, marksObtained, evaluations: rows };
}

class StudentService {
  async login(email, password) {
    const normalizedEmail = normalizeEmail(email);
    const user = await User.findOne({ email: normalizedEmail, role: 'STUDENT' });
    if (!user) {
      throw new AppError('Invalid credentials', 401);
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      throw new AppError('Invalid credentials', 401);
    }

    const token = signToken({ userId: user._id, role: user.role });
    return new AuthResponseDto(token, {
      id: user._id,
      email: user.email,
      name: user.name,
      role: user.role
    });
  }

  async getDashboard(studentEmail) {
    const normalizedEmail = normalizeEmail(studentEmail);
    const user = await User.findOne({ email: normalizedEmail, role: 'STUDENT' });
    if (!user) {
      throw new AppError('Student not found', 404);
    }

    const student = await StudentRepository.findByEmail(normalizedEmail);
    if (!student) {
      return { studentName: user.name, papers: [] };
    }

    const sheets = await AnswerSheetRepository.findAll({ studentId: student._id });
    const papers = [];

    for (const sheet of sheets) {
      const exam = await ExamRepository.findById(sheet.examId);
      const isPublished = Boolean(exam?.isPublished);
      const evaluations = await QuestionEvaluationRepository.findAll({ sheetId: sheet._id });
      
      const evalStatus = evaluations.some((item) => item.status === 'LOCKED')
        ? 'Reviewed'
        : evaluations.some((item) => item.status === 'DRAFT' || item.status === 'SUBMITTED')
          ? 'In Progress'
          : 'Pending';

      const status = isPublished ? evalStatus : 'Result Not Published Yet';

      papers.push({
        sheetId: sheet._id,
        examName: exam ? `${exam.course} / ${exam.subject}` : 'Unknown exam',
        examContext: exam ? `${exam.semester} ${exam.section} ${exam.examType}` : '',
        pdfUrl: sheet.pdfUrl || '',
        isPublished,
        status
      });
    }

    return {
      studentName: student.name || user.name,
      papers
    };
  }

  async getReport(studentEmail, sheetId) {
    const normalizedEmail = normalizeEmail(studentEmail);
    const user = await User.findOne({ email: normalizedEmail, role: 'STUDENT' });
    if (!user) {
      throw new AppError('Student not found', 404);
    }

    const sheet = await AnswerSheetRepository.findById(sheetId);
    if (!sheet) {
      throw new AppError('Paper not found', 404);
    }

    const student = await StudentRepository.findById(sheet.studentId);
    if (!student || normalizeEmail(student.email) !== normalizedEmail) {
      throw new AppError('Access denied', 403);
    }

    const exam = await ExamRepository.findById(sheet.examId);
    if (!exam || !exam.isPublished) {
      throw new AppError('Results for this examination have not been published by the Examination Cell yet.', 403);
    }

    const evaluations = await QuestionEvaluationRepository.findAll({ sheetId: sheet._id });

    const enrichedEvaluations = [];
    for (const evaluation of evaluations) {
      const faculty = await FacultyRepository.findById(evaluation.facultyId);
      const facultyUser = faculty ? await User.findById(faculty.userId) : null;
      enrichedEvaluations.push({
        ...evaluation.toObject(),
        facultyName: facultyUser?.name || faculty?.name || 'Pending review'
      });
    }

    const summary = buildReportSummary(enrichedEvaluations, exam?.questionWeightage || []);
    const convertedScale = exam?.convertedScale || 30;
    const convertedMarks = summary.fullMarks > 0
      ? Number(((summary.marksObtained / summary.fullMarks) * convertedScale).toFixed(2))
      : 0;

    return {
      studentName: student.name || user.name,
      sheetId: sheet._id,
      sheetPdfUrl: sheet.pdfUrl || '',
      answerKeyUrl: exam?.answerKeyUrl || '',
      examName: `${exam.course} / ${exam.subject}`,
      examContext: `${exam.semester} ${exam.section} ${exam.examType}`,
      fullMarks: summary.fullMarks,
      marksObtained: summary.marksObtained,
      convertedScale,
      convertedMarks,
      evaluations: summary.evaluations
    };
  }

  async changePassword(studentEmail, oldPassword, newPassword) {
    const normalizedEmail = normalizeEmail(studentEmail);
    const user = await User.findOne({ email: normalizedEmail, role: 'STUDENT' });
    if (!user) {
      throw new AppError('Student not found', 404);
    }

    const match = await bcrypt.compare(oldPassword, user.password);
    if (!match) {
      throw new AppError('Old password is incorrect', 400);
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    return { success: true };
  }
}

module.exports = new StudentService();
module.exports.buildReportSummary = buildReportSummary;
