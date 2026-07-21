class UnlockEvaluationRequestDto {
  constructor(evaluationId, performedBy) {
    this.evaluationId = evaluationId;
    this.performedBy = performedBy;
  }
}

module.exports = UnlockEvaluationRequestDto;
