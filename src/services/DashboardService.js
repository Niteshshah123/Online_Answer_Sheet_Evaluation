const ExamRepository = require('../repositories/ExamRepository');
const StudentRepository = require('../repositories/StudentRepository');
const QuestionEvaluationRepository = require('../repositories/QuestionEvaluationRepository');
const DashboardResponseDto = require('../dto/response/DashboardResponseDto');

class DashboardService {
  async getDashboard() {
    const [totalExams, totalStudents, allEvaluations, submittedEvaluations, lockedEvaluations] = await Promise.all([
      ExamRepository.findAll().then((items) => items.length),
      StudentRepository.findAll().then((items) => items.length),
      QuestionEvaluationRepository.findAll().then((items) => items),
      QuestionEvaluationRepository.findAll({ status: 'SUBMITTED' }).then((items) => items.length),
      QuestionEvaluationRepository.findAll({ status: 'LOCKED' }).then((items) => items.length)
    ]);

    const completedPapers = allEvaluations.filter((item) => item.status === 'SUBMITTED' || item.status === 'LOCKED' || item.status === 'UNLOCKED').length;
    const remainingPapers = allEvaluations.filter((item) => item.status === 'PENDING').length;

    return new DashboardResponseDto({
      totalExams,
      totalStudents,
      checkedPapers: completedPapers,
      remainingPapers,
      lockedEvaluations,
      submittedEvaluations
    });
  }

  async refreshMetrics() {
    return true;
  }
}

module.exports = new DashboardService();
