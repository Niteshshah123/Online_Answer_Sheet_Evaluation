const AuditLog = require('../models/entities/auditLogModel');

class AuditObserver {
  async onEvent(action, performedBy, details) {
    await AuditLog.create({ action, performedBy, details });
  }
}

module.exports = new AuditObserver();
