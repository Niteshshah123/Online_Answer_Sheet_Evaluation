class UnlockCommand {
  constructor(evaluationService) {
    this.evaluationService = evaluationService;
  }

  async execute(evaluationId, performedBy) {
    return this.evaluationService.unlockEvaluation(evaluationId, performedBy);
  }
}

module.exports = UnlockCommand;
