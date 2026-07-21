const AppError = require('../exceptions/AppError');
const FacultyRepository = require('../repositories/FacultyRepository');
const QuestionAllocationRepository = require('../repositories/QuestionAllocationRepository');
const QuestionEvaluationRepository = require('../repositories/QuestionEvaluationRepository');
const AnswerSheetRepository = require('../repositories/AnswerSheetRepository');
const ExamRepository = require('../repositories/ExamRepository');
const StudentRepository = require('../repositories/StudentRepository');
const AuditLogRepository = require('../repositories/AuditLogRepository');

class FacultyEvaluationService {
  async getFacultySheetEvaluations(facultyEmail, sheetId) {
    const faculty = await FacultyRepository.findOne({ email: facultyEmail });
    if (!faculty) throw new AppError('Faculty not found', 404);

    const sheet = await AnswerSheetRepository.findById(sheetId);
    if (!sheet) throw new AppError('Answer sheet not found', 404);

    const allocations = await QuestionAllocationRepository.findByFacultyId(faculty._id);
    const relevant = allocations.filter((allocation) => allocation.examId.toString() === sheet.examId.toString());

    // console.log(relevant.length);

    if (!relevant.length) {
      return { sheetId: sheet._id, sheetPdfUrl: sheet.pdfUrl || '', answerKeyUrl: '', evaluations: [] };
    }

    const evaluations = await QuestionEvaluationRepository.findAll({
      sheetId,
      facultyId: faculty._id
    });

    const exam = await ExamRepository.findById(sheet.examId);
    const answerKeyUrl = exam ? (exam.answerKeyUrl || '') : '';

    const filtered = evaluations
      .filter((item) => relevant.some((allocation) => item.questionNumber >= allocation.fromQuestion && item.questionNumber <= allocation.toQuestion))
      .map((item) => ({
        evaluationId: item._id,
        questionNumber: item.questionNumber,
        marksObtained: item.marksObtained,
        review: item.review || '',
        status: item.status,
        maxMark: exam?.questionWeightage?.[item.questionNumber - 1] ?? null
      }))
      .sort((a, b) => a.questionNumber - b.questionNumber);

    return { sheetId: sheet._id, sheetPdfUrl: sheet.pdfUrl || '', answerKeyUrl, evaluations: filtered };
  }

  async saveDraft(facultyEmail, sheetId, updates) {
    const faculty = await FacultyRepository.findOne({ email: facultyEmail });
    if (!faculty) throw new AppError('Faculty not found', 404);

    const sheet = await AnswerSheetRepository.findById(sheetId);
    if (!sheet) throw new AppError('Answer sheet not found', 404);

    for (const update of updates || []) {
      const evaluation = await QuestionEvaluationRepository.findById(update.evaluationId);
      if (!evaluation) continue;
      if (evaluation.facultyId.toString() !== faculty._id.toString()) continue;
      if (evaluation.sheetId.toString() !== sheetId) continue;
      if (evaluation.status === 'LOCKED' || evaluation.status === 'UNLOCK_REQUESTED') continue;
      if (update.marksObtained !== undefined && update.marksObtained !== null) {
        // clamp to question max if available
        const sheetForEval = await AnswerSheetRepository.findById(evaluation.sheetId);
        const examForEval = sheetForEval ? await ExamRepository.findById(sheetForEval.examId) : null;
        const maxMark = examForEval?.questionWeightage?.[evaluation.questionNumber - 1];
        evaluation.marksObtained = (maxMark != null) ? Math.min(update.marksObtained, maxMark) : update.marksObtained;
      } else {
        evaluation.marksObtained = update.marksObtained ?? evaluation.marksObtained;
      }
      evaluation.review = update.review ?? evaluation.review;
      evaluation.status = 'DRAFT';
      evaluation.updatedAt = new Date();
      await evaluation.save();
    }

    await AuditLogRepository.create({ action: 'FACULTY_DRAFT_SAVE', performedBy: facultyEmail, details: `Draft save for sheet ${sheetId}` });
    return { success: true };
  }

  async submitSheet(facultyEmail, sheetId, updates) {
    const faculty = await FacultyRepository.findOne({ email: facultyEmail });
    if (!faculty) throw new AppError('Faculty not found', 404);

    const sheet = await AnswerSheetRepository.findById(sheetId);
    if (!sheet) throw new AppError('Answer sheet not found', 404);

    for (const update of updates || []) {
      const evaluation = await QuestionEvaluationRepository.findById(update.evaluationId);
      if (!evaluation) continue;
      if (evaluation.facultyId.toString() !== faculty._id.toString()) continue;
      if (evaluation.sheetId.toString() !== sheetId) continue;
      if (evaluation.status === 'LOCKED' || evaluation.status === 'UNLOCK_REQUESTED') continue;
      if (update.marksObtained !== undefined && update.marksObtained !== null) {
        const sheetForEval = await AnswerSheetRepository.findById(evaluation.sheetId);
        const examForEval = sheetForEval ? await ExamRepository.findById(sheetForEval.examId) : null;
        const maxMark = examForEval?.questionWeightage?.[evaluation.questionNumber - 1];
        evaluation.marksObtained = (maxMark != null) ? Math.min(update.marksObtained, maxMark) : update.marksObtained;
      } else {
        evaluation.marksObtained = update.marksObtained ?? evaluation.marksObtained;
      }
      evaluation.review = update.review ?? evaluation.review;
      evaluation.status = 'LOCKED';
      evaluation.updatedAt = new Date();
      await evaluation.save();
    }

    await AuditLogRepository.create({ action: 'FACULTY_SUBMIT', performedBy: facultyEmail, details: `Submitted sheet ${sheetId}` });
    return { success: true };
  }

  async requestUnlock(facultyEmail, sheetId) {
    const faculty = await FacultyRepository.findOne({ email: facultyEmail });
    if (!faculty) throw new AppError('Faculty not found', 404);

    const sheet = await AnswerSheetRepository.findById(sheetId);
    if (!sheet) throw new AppError('Answer sheet not found', 404);

    const evaluations = await QuestionEvaluationRepository.findAll({ sheetId, facultyId: faculty._id });
    for (const evaluation of evaluations) {
      if (evaluation.status === 'LOCKED' || evaluation.status === 'SUBMITTED') {
        evaluation.status = 'UNLOCK_REQUESTED';
        evaluation.updatedAt = new Date();
        await evaluation.save();
      }
    }

    await AuditLogRepository.create({ action: 'FACULTY_UNLOCK_REQUEST', performedBy: facultyEmail, details: `Unlock requested for sheet ${sheetId}` });
    return { success: true };
  }

  async getFacultyDashboardItems(facultyEmail) {
    const faculty = await FacultyRepository.findOne({ email: facultyEmail });
    if (!faculty) throw new AppError('Faculty not found', 404);

    const allocations = await QuestionAllocationRepository.findByFacultyId(faculty._id);
    const items = [];

    for (const allocation of allocations) {
      const exam = await ExamRepository.findById(allocation.examId);
      const answerSheets = await QuestionEvaluationRepository.findAll({ facultyId: faculty._id });
      const sheetIds = new Set(answerSheets.map((item) => item.sheetId.toString()));

      for (const sheetId of sheetIds) {
        const sheet = await AnswerSheetRepository.findById(sheetId);
        if (!sheet || sheet.examId.toString() !== allocation.examId.toString()) continue;

        const evaluations = await QuestionEvaluationRepository.findAll({ sheetId, facultyId: faculty._id });
        const relevant = evaluations.filter((item) => item.questionNumber >= allocation.fromQuestion && item.questionNumber <= allocation.toQuestion);
        const statuses = relevant.map((item) => item.status);
        const min = relevant[0]?.questionNumber;
        const max = relevant[relevant.length - 1]?.questionNumber;
        const student = await StudentRepository.findById(sheet.studentId);
        items.push({
          sheetId: sheet._id,
          studentName: student?.name || 'Unknown',
          registrationNumber: student?.registrationNumber || 'N/A',
          examName: exam ? `${exam.course} / ${exam.subject}` : 'Unknown',
          questionRange: min && max ? `Q${min} to Q${max}` : 'N/A',
          status: statuses.includes('LOCKED') ? 'LOCKED' : statuses.includes('DRAFT') ? 'DRAFT' : 'PENDING'
        });
      }
    }

    return items;
  }
}

module.exports = new FacultyEvaluationService();
