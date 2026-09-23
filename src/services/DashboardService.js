const ExamRepository = require('../repositories/ExamRepository');
const StudentRepository = require('../repositories/StudentRepository');
const AnswerSheetRepository = require('../repositories/AnswerSheetRepository');
const QuestionEvaluationRepository = require('../repositories/QuestionEvaluationRepository');
const FacultyRepository = require('../repositories/FacultyRepository');
const AuditLogRepository = require('../repositories/AuditLogRepository');
const DashboardResponseDto = require('../dto/response/DashboardResponseDto');

class DashboardService {
  async getDashboard() {
    const [exams, students, sheets, allEvaluations, faculties] = await Promise.all([
      ExamRepository.findAll(),
      StudentRepository.findAll(),
      AnswerSheetRepository.findAll(),
      QuestionEvaluationRepository.findAll(),
      FacultyRepository.findAll()
    ]);

    // Group evaluations by sheetId
    const sheetEvalMap = new Map();
    for (const ev of allEvaluations) {
      const sId = ev.sheetId.toString();
      if (!sheetEvalMap.has(sId)) {
        sheetEvalMap.set(sId, []);
      }
      sheetEvalMap.get(sId).push(ev);
    }

    let checkedPapersCount = 0;
    let partiallyCheckedPapersCount = 0;
    let notCheckedPapersCount = 0;

    const isEvalDone = (e) =>
      ['COMPLETED', 'SUBMITTED', 'LOCKED'].includes(e.status) ||
      (e.marksObtained !== null && e.marksObtained !== undefined && e.marksObtained !== '');

    for (const sheet of sheets) {
      const evs = sheetEvalMap.get(sheet._id.toString()) || [];
      if (!evs.length) {
        notCheckedPapersCount += 1;
        continue;
      }
      const doneCount = evs.filter(isEvalDone).length;
      if (doneCount === evs.length) {
        checkedPapersCount += 1;
      } else if (doneCount > 0 || evs.some((e) => e.status === 'DRAFT' || (e.marksObtained !== null && e.marksObtained !== undefined))) {
        partiallyCheckedPapersCount += 1;
      } else {
        notCheckedPapersCount += 1;
      }
    }

    // Faculty progress metrics
    const facultyProgress = [];
    for (const faculty of faculties) {
      const facultyEvs = allEvaluations.filter((ev) => ev.facultyId.toString() === faculty._id.toString());
      const facultySheetIds = new Set(facultyEvs.map((ev) => ev.sheetId.toString()));
      let facultyCompletedSheets = 0;
      let facultyPendingSheets = 0;

      for (const sId of facultySheetIds) {
        const evs = facultyEvs.filter((ev) => ev.sheetId.toString() === sId);
        const allDone = evs.length > 0 && evs.every(isEvalDone);
        if (allDone) {
          facultyCompletedSheets += 1;
        } else {
          facultyPendingSheets += 1;
        }
      }

      const totalSheets = facultySheetIds.size;
      const pct = totalSheets > 0 ? Math.round((facultyCompletedSheets / totalSheets) * 100) : 0;

      facultyProgress.push({
        facultyId: faculty._id,
        name: faculty.name,
        email: faculty.email,
        totalAssignedSheets: totalSheets,
        completedSheetsCount: facultyCompletedSheets,
        pendingSheetsCount: facultyPendingSheets,
        completionPercentage: pct
      });
    }

    // ── Exam Overview (per-exam breakdown) ──
    // Group sheets by examId
    const examSheetMap = new Map();
    for (const sheet of sheets) {
      const eId = sheet.examId.toString();
      if (!examSheetMap.has(eId)) examSheetMap.set(eId, []);
      examSheetMap.get(eId).push(sheet);
    }

    const examOverview = exams.map((exam) => {
      const examSheets = examSheetMap.get(exam._id.toString()) || [];
      const studentCount = examSheets.length;

      let evaluatedCount = 0;
      for (const sheet of examSheets) {
        const evs = sheetEvalMap.get(sheet._id.toString()) || [];
        if (evs.length > 0 && evs.every((e) => e.status === 'LOCKED')) {
          evaluatedCount += 1;
        }
      }

      const progressPct = studentCount > 0 ? Math.round((evaluatedCount / studentCount) * 100) : 0;

      // Determine status
      let status = 'Not Started';
      if (exam.isPublished) {
        status = 'Published';
      } else if (exam.finalSubmittedToAdmin) {
        status = 'Ready to Publish';
      } else if (evaluatedCount === studentCount && studentCount > 0) {
        status = 'Ready to Publish';
      } else if (evaluatedCount > 0) {
        status = 'In Progress';
      } else if (studentCount > 0) {
        status = 'Pending';
      }

      return {
        examId: exam._id,
        examType: exam.examType,
        course: exam.course,
        subject: exam.subject,
        semester: exam.semester,
        section: exam.section,
        studentCount,
        evaluatedCount,
        progressPct,
        status,
        isPublished: exam.isPublished || false,
        finalSubmittedToAdmin: exam.finalSubmittedToAdmin || false,
        createdAt: exam.createdAt
      };
    });

    // ── Recent Activity (last 5 audit logs) ──
    const allLogs = await AuditLogRepository.findAll();
    // Sort by timestamp descending and take latest 5
    const sortedLogs = allLogs
      .sort((a, b) => new Date(b.timestamp || b.createdAt || 0) - new Date(a.timestamp || a.createdAt || 0))
      .slice(0, 5);

    const recentActivity = sortedLogs.map((log) => ({
      action: log.action,
      performedBy: log.performedBy,
      details: log.details,
      timestamp: log.timestamp || log.createdAt
    }));

    return new DashboardResponseDto({
      totalExams: exams.length,
      totalStudents: students.length,
      totalAnswerSheets: sheets.length,
      checkedPapersCount,
      partiallyCheckedPapersCount,
      notCheckedPapersCount,
      facultyProgress,
      examOverview,
      recentActivity
    });
  }

  async refreshMetrics() {
    return true;
  }
}

module.exports = new DashboardService();
