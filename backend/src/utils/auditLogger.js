const AuditLog = require('../models/AuditLog');

const logAudit = async ({ req, action, entityType, entityId = null, metadata = {} }) => {
  try {
    const actorUserId = req?.user?._id || null;
    const ipAddress = req?.headers['x-forwarded-for'] || req?.socket?.remoteAddress || '';
    await AuditLog.create({ actorUserId, action, entityType, entityId, metadata, ipAddress });
  } catch (err) {
    console.error('Audit Log Error:', err.message);
  }
};

module.exports = { logAudit };