const ExamRepository = require('../repositories/ExamRepository');
const StudentRepository = require('../repositories/StudentRepository');
const AnswerSheetRepository = require('../repositories/AnswerSheetRepository');
const QuestionEvaluationRepository = require('../repositories/QuestionEvaluationRepository');
const FacultyRepository = require('../repositories/FacultyRepository');
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

    for (const sheet of sheets) {
      const evs = sheetEvalMap.get(sheet._id.toString()) || [];
      if (!evs.length) {
        notCheckedPapersCount += 1;
        continue;
      }
      const lockedCount = evs.filter((e) => e.status === 'LOCKED').length;
      if (lockedCount === evs.length) {
        checkedPapersCount += 1;
      } else if (lockedCount > 0) {
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
        const allLocked = evs.length > 0 && evs.every((ev) => ev.status === 'LOCKED');
        if (allLocked) {
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

    return new DashboardResponseDto({
      totalExams: exams.length,
      totalStudents: students.length,
      totalAnswerSheets: sheets.length,
      checkedPapersCount,
      partiallyCheckedPapersCount,
      notCheckedPapersCount,
      facultyProgress
    });
  }

  async refreshMetrics() {
    return true;
  }
}

module.exports = new DashboardService();

