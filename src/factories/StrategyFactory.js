const EqualDistributionStrategy = require('../strategies/distribution/EqualDistributionStrategy');
const ManualDistributionStrategy = require('../strategies/distribution/ManualDistributionStrategy');
const WeightedDistributionStrategy = require('../strategies/distribution/WeightedDistributionStrategy');

class StrategyFactory {
  create(type) {
    switch (type) {
      case 'EQUAL':
        return new EqualDistributionStrategy();
      case 'MANUAL':
        return new ManualDistributionStrategy();
      case 'WEIGHTED':
        return new WeightedDistributionStrategy();
      default:
        return new EqualDistributionStrategy();
    }
  }
}

module.exports = new StrategyFactory();
