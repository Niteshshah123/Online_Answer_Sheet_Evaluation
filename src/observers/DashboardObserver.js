const dashboardService = require('../services/DashboardService');

class DashboardObserver {
  constructor(dashboardService) {
    this.dashboardService = dashboardService;
  }

  async onImportCompleted() {
    await this.dashboardService.refreshMetrics();
  }
}

module.exports = new DashboardObserver(dashboardService);
