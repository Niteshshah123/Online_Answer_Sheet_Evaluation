const AppError = require('../exceptions/AppError');
const User = require('../models/entities/userModel');
const Faculty = require('../models/entities/facultyModel');
const Exam = require('../models/entities/examModel');
const QuestionAllocation = require('../models/entities/questionAllocationModel');
const StudentRepository = require('../repositories/StudentRepository');
const AnswerSheetRepository = require('../repositories/AnswerSheetRepository');
const ExamRepository = require('../repositories/ExamRepository');
const QuestionEvaluationRepository = require('../repositories/QuestionEvaluationRepository');
const QuestionAllocationRepository = require('../repositories/QuestionAllocationRepository');
const FacultyRepository = require('../repositories/FacultyRepository');
const DoubtRepository = require('../repositories/DoubtRepository');
const QuestionEvaluation = require('../models/entities/questionEvaluationModel');

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

const NotificationService = require('./NotificationService');

class DoubtService {
  async raiseDoubt({ studentEmail, sheetId, questionNumber, category, comment }) {
    if (!comment || !String(comment).trim()) {
      throw new AppError('Comment is required to raise a doubt', 400);
    }

    const normalized = normalizeEmail(studentEmail);
    const user = await User.findOne({ email: normalized, role: 'STUDENT' });
    if (!user) {
      throw new AppError('Student not found', 404);
    }

    const student = await StudentRepository.findByEmailOrUserId(normalized, user._id);
    if (!student) {
      throw new AppError('Student profile not found', 404);
    }

    const sheet = await AnswerSheetRepository.findById(sheetId);
    if (!sheet) {
      throw new AppError('Answer sheet not found', 404);
    }

    if (String(sheet.studentId) !== String(student._id) && String(student.userId) !== String(user._id)) {
      throw new AppError('Access denied: You can only raise doubts for your own answer sheet', 403);
    }

    const exam = await ExamRepository.findById(sheet.examId);
    if (!exam) {
      throw new AppError('Exam not found', 404);
    }

    const qNum = questionNumber ? Number(questionNumber) : null;
    let facultyId = null;

    // 1. Check if an evaluation exists for this question to find the exact faculty evaluator
    if (qNum) {
      const evaluation = await QuestionEvaluation.findOne({ sheetId: sheet._id, questionNumber: qNum });
      if (evaluation && evaluation.facultyId) {
        facultyId = evaluation.facultyId;
      }
    }

    // 2. If facultyId not found from evaluation, check allocations for this question
    if (!facultyId && qNum) {
      const allocations = await QuestionAllocationRepository.findAll({ examId: exam._id });
      const alloc = allocations.find(a => qNum >= a.fromQuestion && qNum <= a.toQuestion);
      if (alloc && alloc.facultyId) {
        facultyId = alloc.facultyId;
      }
    }

    // 3. Fallback to course in-charge faculty if available
    if (!facultyId && exam.courseInChargeFacultyId) {
      facultyId = exam.courseInChargeFacultyId;
    }

    if (qNum) {
      const existingPending = await DoubtRepository.model.findOne({
        sheetId: sheet._id,
        questionNumber: qNum,
        status: { $in: ['PENDING', 'IN_REVIEW'] }
      });
      if (existingPending) {
        throw new AppError('A query is already pending for this question. You can raise another query once your teacher replies.', 400);
      }
    }

    const existingCount = qNum
      ? await DoubtRepository.model.countDocuments({ sheetId: sheet._id, questionNumber: qNum })
      : 0;
    const iteration = existingCount + 1;

    const doubt = await DoubtRepository.create({
      sheetId: sheet._id,
      examId: exam._id,
      studentId: student._id,
      facultyId: facultyId || null,
      questionNumber: qNum,
      category: category || 'DOUBT',
      comment: String(comment).trim(),
      status: 'PENDING',
      iteration
    });

    // Notify the evaluator or in-charge faculty
    try {
      let targetUserId = null;
      if (facultyId) {
        const facDoc = await FacultyRepository.findById(facultyId);
        if (facDoc && facDoc.userId) targetUserId = facDoc.userId;
      }
      if (!targetUserId && exam.courseInChargeFacultyId) {
        const inChargeDoc = await FacultyRepository.findById(exam.courseInChargeFacultyId);
        if (inChargeDoc && inChargeDoc.userId) targetUserId = inChargeDoc.userId;
      }

      if (targetUserId) {
        await NotificationService.createNotification({
          userId: targetUserId,
          title: `✋ Query on ${qNum ? 'Question ' + qNum : 'Paper'} (${student.name || 'Student'})`,
          message: `${student.name || 'Student'} (${student.registrationNumber || ''}) requested clarification: "${comment.substring(0, 100)}"`,
          type: 'DOUBT_RAISED',
          link: '/faculty/assignments?tab=doubts',
          referenceId: doubt._id
        });
      }
    } catch (notifErr) {
      console.error('Failed to notify faculty about doubt:', notifErr);
    }

    return doubt;
  }

  async getStudentDoubts(studentEmail, sheetId = null) {
    const normalized = normalizeEmail(studentEmail);
    const user = await User.findOne({ email: normalized, role: 'STUDENT' });
    if (!user) {
      throw new AppError('Student not found', 404);
    }

    let doubts = [];
    if (sheetId) {
      doubts = await DoubtRepository.findBySheetId(sheetId);
    } else {
      const student = await StudentRepository.findByEmailOrUserId(normalized, user._id);
      if (!student) {
        return [];
      }
      const studentSheets = await AnswerSheetRepository.findByStudentId(student._id);
      const sheetIds = studentSheets.map(s => s._id);

      doubts = await DoubtRepository.model.find({
        $or: [
          { studentId: student._id },
          ...(sheetIds.length > 0 ? [{ sheetId: { $in: sheetIds } }] : [])
        ]
      }).sort({ createdAt: -1 });
    }

    const enriched = [];

    for (const d of doubts) {
      let facultyName = 'Course Faculty';
      if (d.facultyId) {
        const faculty = await FacultyRepository.findById(d.facultyId);
        if (faculty) {
          const facultyUser = await User.findById(faculty.userId);
          facultyName = facultyUser?.name || faculty.name || 'Course Faculty';
        }
      }

      const cleanFacultyName = (facultyName || 'Course Faculty').replace(/\s*\(.*?\)\s*/g, '').trim() || 'Course Faculty';

      let exam = null;
      let sheet = null;
      if (d.examId) {
        exam = await Exam.findById(d.examId);
      }
      if (d.sheetId) {
        sheet = await AnswerSheetRepository.findById(d.sheetId);
      }

      let currentMark = null;
      let maxMark = null;
      let queryCount = 1;
      if (d.questionNumber && d.sheetId) {
        const ev = await QuestionEvaluation.findOne({ sheetId: d.sheetId, questionNumber: d.questionNumber });
        currentMark = ev ? ev.marksObtained : null;
        if (exam && exam.questionWeightage) {
          maxMark = exam.questionWeightage[d.questionNumber - 1] ?? null;
        }
        queryCount = await DoubtRepository.model.countDocuments({ sheetId: d.sheetId, questionNumber: d.questionNumber });
      }

      enriched.push({
        ...d.toObject(),
        facultyName,
        cleanFacultyName,
        course: exam?.course || '—',
        subject: exam?.subject || '—',
        examType: exam?.examType || 'EXAM',
        semester: exam?.semester || '',
        section: exam?.section || '',
        examName: exam ? `${exam.subject} (${exam.examType || 'Exam'})` : 'Exam',
        sheetPdfUrl: sheet?.pdfUrl || '',
        currentMark,
        maxMark,
        queryCount,
        finalSubmittedToAdmin: Boolean(exam?.finalSubmittedToAdmin)
      });
    }

    return enriched;
  }

  async followUpDoubt({ studentEmail, doubtId, followUpComment }) {
    const normalized = normalizeEmail(studentEmail);
    const user = await User.findOne({ email: normalized, role: 'STUDENT' });
    if (!user) {
      throw new AppError('Student not found', 404);
    }

    const doubt = await DoubtRepository.findById(doubtId);
    if (!doubt) {
      throw new AppError('Doubt not found', 404);
    }

    if (!followUpComment || !String(followUpComment).trim()) {
      throw new AppError('Follow-up message is required', 400);
    }

    // Append follow-up comment
    doubt.comment = `${doubt.comment}\n\n[Student Follow-up - ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}]: ${String(followUpComment).trim()}`;
    doubt.status = 'PENDING';
    await doubt.save();

    // Notify evaluator
    if (doubt.facultyId) {
      try {
        const faculty = await FacultyRepository.findById(doubt.facultyId);
        if (faculty && faculty.userId) {
          await NotificationService.createNotification({
            userId: faculty.userId,
            title: `🔄 Student Follow-up: Q${doubt.questionNumber || 'Paper'}`,
            message: `Student posted a follow-up query: "${followUpComment.substring(0, 100)}"`,
            type: 'DOUBT_FOLLOWUP',
            link: '/faculty/assignments?tab=doubts',
            referenceId: doubt._id
          });
        }
      } catch (err) {
        console.error('Failed to notify faculty about follow-up:', err);
      }
    }

    return doubt;
  }

  async getFacultyDoubts(facultyEmail, statusFilter) {
    const normalized = normalizeEmail(facultyEmail);
    const user = await User.findOne({ email: normalized, role: 'FACULTY' });
    if (!user) {
      throw new AppError('Faculty not found', 404);
    }

    const faculty = await FacultyRepository.findByUserId(user._id) || await FacultyRepository.findByEmail(normalized) || await Faculty.findOne({ email: normalized });
    if (!faculty) {
      throw new AppError('Faculty entity not found', 404);
    }

    // Find all sheets where this faculty is assigned or evaluated ANY question
    const evaluatedSheetIds = await QuestionEvaluation.distinct('sheetId', {
      $or: [{ facultyId: faculty._id }, { facultyId: user._id }]
    });

    // Find all exams where this faculty is in-charge or allocated
    const inChargeExams = await Exam.find({
      $or: [{ courseInChargeFacultyId: faculty._id }, { courseInChargeFacultyId: user._id }]
    }).distinct('_id');

    const allocatedExams = await QuestionAllocation.distinct('examId', {
      $or: [{ facultyId: faculty._id }, { facultyId: user._id }]
    });

    const relevantExamIds = [...new Set([...inChargeExams.map(String), ...allocatedExams.map(String)])];

    const orConditions = [
      { facultyId: faculty._id },
      { facultyId: user._id }
    ];

    if (evaluatedSheetIds.length > 0) {
      orConditions.push({ sheetId: { $in: evaluatedSheetIds } });
    }
    if (relevantExamIds.length > 0) {
      orConditions.push({ examId: { $in: relevantExamIds } });
    }
    orConditions.push({ facultyId: null });

    const query = { $or: orConditions };

    if (statusFilter && statusFilter !== 'ALL') {
      query.status = statusFilter;
    }

    const rawDoubts = await DoubtRepository.model.find(query).sort({ createdAt: -1 });
    const enriched = [];

    for (const d of rawDoubts) {
      const student = await StudentRepository.findById(d.studentId);
      const exam = await ExamRepository.findById(d.examId);
      const sheet = await AnswerSheetRepository.findById(d.sheetId);

      // Check current marks if question-specific
      let currentMark = null;
      let maxMark = null;
      let queryCount = 1;
      if (d.questionNumber) {
        const ev = await QuestionEvaluation.findOne({ sheetId: d.sheetId, questionNumber: d.questionNumber });
        currentMark = ev ? ev.marksObtained : null;
        if (exam && exam.questionWeightage) {
          maxMark = exam.questionWeightage[d.questionNumber - 1] ?? null;
        }
        if (d.sheetId) {
          queryCount = await DoubtRepository.model.countDocuments({ sheetId: d.sheetId, questionNumber: d.questionNumber });
        }
      }

      enriched.push({
        ...d.toObject(),
        studentName: student?.name || 'Student',
        studentRegNo: student?.registrationNumber || '—',
        studentEmail: student?.email || '—',
        examName: exam ? `${exam.course} / ${exam.subject}` : 'Exam',
        examContext: exam ? `${exam.semester} ${exam.section} ${exam.examType}` : '',
        sheetPdfUrl: sheet?.pdfUrl || '',
        currentMark,
        maxMark,
        queryCount,
        finalSubmittedToAdmin: Boolean(exam?.finalSubmittedToAdmin)
      });
    }

    return enriched;
  }

  async replyDoubt({ facultyEmail, doubtId, teacherReply, status = 'RESOLVED', updatedMarks = null }) {
    const normalized = normalizeEmail(facultyEmail);
    const user = await User.findOne({ email: normalized, role: 'FACULTY' });
    if (!user) {
      throw new AppError('Faculty not found', 404);
    }

    const doubt = await DoubtRepository.findById(doubtId);
    if (!doubt) {
      throw new AppError('Doubt not found', 404);
    }

    if (!teacherReply || !String(teacherReply).trim()) {
      throw new AppError('Teacher response is required', 400);
    }

    const exam = await ExamRepository.findById(doubt.examId);
    const isFinalSubmitted = Boolean(exam?.finalSubmittedToAdmin);

    // If faculty also chose to adjust marks for the specific question
    let markWasChanged = false;
    if (updatedMarks !== null && updatedMarks !== undefined && doubt.questionNumber) {
      const evaluation = await QuestionEvaluation.findOne({ sheetId: doubt.sheetId, questionNumber: doubt.questionNumber });
      if (evaluation) {
        const isDifferentMark = Number(updatedMarks) !== Number(evaluation.marksObtained);
        if (isFinalSubmitted && isDifferentMark) {
          throw new AppError('Marks cannot be modified: Exam marks are permanently submitted to Admin.', 403);
        }
        if (!isFinalSubmitted && isDifferentMark) {
          evaluation.marksObtained = Number(updatedMarks);
          evaluation.review = (evaluation.review ? `${evaluation.review} | ` : '') + `[Doubt Resolution]: ${teacherReply}`;
          await evaluation.save();
          markWasChanged = true;
        }
      }
    }

    doubt.teacherReply = String(teacherReply).trim();
    doubt.status = status || 'RESOLVED';
    doubt.resolvedAt = new Date();
    doubt.resolvedBy = user._id;
    await doubt.save();

    // Notify the student about teacher's clarification
    try {
      const student = await StudentRepository.findById(doubt.studentId);
      let studentUserId = null;
      if (student && student.userId) {
        studentUserId = student.userId;
      } else if (student && student.email) {
        const studentUser = await User.findOne({ email: student.email.toLowerCase() });
        if (studentUser) studentUserId = studentUser._id;
      }

      if (studentUserId) {
        const markAdjustment = updatedMarks !== null && updatedMarks !== undefined ? ` (Marks updated to ${updatedMarks})` : '';
        await NotificationService.createNotification({
          userId: studentUserId,
          title: `💬 Teacher Clarification: ${doubt.questionNumber ? 'Question ' + doubt.questionNumber : 'Paper'}`,
          message: `Status: ${doubt.status}. Teacher response: "${teacherReply.substring(0, 100)}"${markAdjustment}`,
          type: 'DOUBT_REPLIED',
          link: `/student/report/${doubt.sheetId}`,
          referenceId: doubt._id
        });
      }
    } catch (notifErr) {
      console.error('Failed to notify student about doubt reply:', notifErr);
    }

    return doubt;
  }
}

module.exports = new DoubtService();
