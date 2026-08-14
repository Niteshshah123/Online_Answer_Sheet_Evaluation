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

    if (!relevant.length) {
      return { sheetId: sheet._id, sheetPdfUrl: sheet.pdfUrl || '', answerKeyUrl: '', evaluations: [], convertedScale: 30 };
    }

    const evaluations = await QuestionEvaluationRepository.findAll({
      sheetId,
      facultyId: faculty._id
    });

    const exam = await ExamRepository.findById(sheet.examId);
    const answerKeyUrl = exam ? (exam.answerKeyUrl || '') : '';
    const convertedScale = exam?.convertedScale || 30;

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

    return {
      sheetId: sheet._id,
      sheetPdfUrl: sheet.pdfUrl || '',
      answerKeyUrl,
      convertedScale,
      evaluations: filtered
    };
  }

  async saveDraft(facultyEmail, sheetId, updates) {
    const faculty = await FacultyRepository.findOne({ email: facultyEmail });
    if (!faculty) throw new AppError('Faculty not found', 404);

    const sheet = await AnswerSheetRepository.findById(sheetId);
    if (!sheet) throw new AppError('Answer sheet not found', 404);

    const exam = await ExamRepository.findById(sheet.examId);

    for (const update of updates || []) {
      const evaluation = await QuestionEvaluationRepository.findById(update.evaluationId);
      if (!evaluation) continue;
      if (evaluation.facultyId.toString() !== faculty._id.toString()) continue;
      if (evaluation.sheetId.toString() !== sheetId) continue;
      if (evaluation.status === 'LOCKED' || evaluation.status === 'UNLOCK_REQUESTED') continue;

      if (update.marksObtained !== undefined && update.marksObtained !== null && update.marksObtained !== '') {
        const val = Number(update.marksObtained);
        if (Number.isNaN(val)) throw new AppError(`Invalid numeric mark for Q${evaluation.questionNumber}`, 400);
        if (val < 0) throw new AppError(`Marks for Question ${evaluation.questionNumber} cannot be negative`, 400);

        const maxMark = exam?.questionWeightage?.[evaluation.questionNumber - 1];
        if (maxMark != null && val > maxMark) {
          throw new AppError(`Marks for Question ${evaluation.questionNumber} (${val}) cannot exceed maximum allowed mark (${maxMark})`, 400);
        }
        evaluation.marksObtained = val;
      } else {
        evaluation.marksObtained = null;
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

    const exam = await ExamRepository.findById(sheet.examId);

    // Verify that ALL assigned evaluations for this faculty & sheet have a valid mark
    const assignedEvaluations = await QuestionEvaluationRepository.findAll({
      sheetId,
      facultyId: faculty._id
    });

    if (!assignedEvaluations.length) {
      throw new AppError('No assigned questions found for this sheet', 400);
    }

    const updateMap = new Map();
    (updates || []).forEach((u) => updateMap.set(String(u.evaluationId), u));

    for (const ev of assignedEvaluations) {
      const u = updateMap.get(String(ev._id));
      const markValue = u ? u.marksObtained : ev.marksObtained;
      if (markValue === null || markValue === undefined || markValue === '') {
        throw new AppError(`Cannot submit evaluation: Question ${ev.questionNumber} has not been evaluated yet. All assigned questions must be marked before submission.`, 400);
      }
    }

    for (const update of updates || []) {
      const evaluation = await QuestionEvaluationRepository.findById(update.evaluationId);
      if (!evaluation) continue;
      if (evaluation.facultyId.toString() !== faculty._id.toString()) continue;
      if (evaluation.sheetId.toString() !== sheetId) continue;
      if (evaluation.status === 'LOCKED' || evaluation.status === 'UNLOCK_REQUESTED') continue;

      const val = Number(update.marksObtained);
      if (Number.isNaN(val)) throw new AppError(`Invalid numeric mark for Q${evaluation.questionNumber}`, 400);
      if (val < 0) throw new AppError(`Marks for Question ${evaluation.questionNumber} cannot be negative`, 400);

      const maxMark = exam?.questionWeightage?.[evaluation.questionNumber - 1];
      if (maxMark != null && val > maxMark) {
        throw new AppError(`Marks for Question ${evaluation.questionNumber} (${val}) cannot exceed maximum allowed mark (${maxMark})`, 400);
      }
      evaluation.marksObtained = val;
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
          status: statuses.includes('LOCKED') ? 'LOCKED' : statuses.includes('UNLOCK_REQUESTED') ? 'UNLOCK_REQUESTED' : statuses.includes('DRAFT') ? 'DRAFT' : 'PENDING'
        });
      }
    }

    return items;
  }
}

module.exports = new FacultyEvaluationService();

