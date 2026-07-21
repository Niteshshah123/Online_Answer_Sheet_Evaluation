const AppError = require('../exceptions/AppError');
const QuestionEvaluationRepository = require('../repositories/QuestionEvaluationRepository');
const AuditLogRepository = require('../repositories/AuditLogRepository');

class EvaluationService {
  async unlockEvaluation(evaluationId, performedBy) {
    const evaluation = await QuestionEvaluationRepository.findById(evaluationId);
    if (!evaluation) {
      throw new AppError('Evaluation not found', 404);
    }

    evaluation.status = 'UNLOCKED';
    evaluation.updatedAt = new Date();
    await evaluation.save();

    await AuditLogRepository.create({
      action: 'UNLOCK_EVALUATION',
      performedBy,
      details: `Unlocked evaluation ${evaluation._id}`
    });

    return evaluation;
  }
}

module.exports = new EvaluationService();
