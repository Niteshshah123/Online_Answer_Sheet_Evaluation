class DistributionConfigRequestDto {
  constructor(examId, strategyType, allocations = []) {
    this.examId = examId;
    this.strategyType = strategyType;
    this.allocations = allocations;
  }
}

module.exports = DistributionConfigRequestDto;
