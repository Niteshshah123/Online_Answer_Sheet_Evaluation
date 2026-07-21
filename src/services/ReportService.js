const ExamRepository = require('../repositories/ExamRepository');
const StudentRepository = require('../repositories/StudentRepository');
const QuestionEvaluationRepository = require('../repositories/QuestionEvaluationRepository');

class ReportService {
  async getReports() {
    const [exams, students, evaluations] = await Promise.all([
      ExamRepository.findAll(),
      StudentRepository.findAll(),
      QuestionEvaluationRepository.findAll()
    ]);

    return {
      totalExams: exams.length,
      totalStudents: students.length,
      totalEvaluations: evaluations.length,
      evaluationsByStatus: this.groupByStatus(evaluations)
    };
  }

  groupByStatus(evaluations) {
    return evaluations.reduce((acc, item) => {
      acc[item.status] = (acc[item.status] || 0) + 1;
      return acc;
    }, {});
  }
}

module.exports = new ReportService();
