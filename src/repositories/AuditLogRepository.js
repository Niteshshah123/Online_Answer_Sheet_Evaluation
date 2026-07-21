const BaseRepository = require('./BaseRepository');
const AuditLog = require('../models/entities/auditLogModel');

class AuditLogRepository extends BaseRepository {
  constructor() {
    super(AuditLog);
  }
}

module.exports = new AuditLogRepository();
