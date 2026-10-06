const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    actorUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    actorName:   { type: String },
    action:      { type: String, required: true },
    entityType:  { type: String },
    entityId:    { type: mongoose.Schema.Types.ObjectId },
    metadata:    { type: mongoose.Schema.Types.Mixed },
    ipAddress:   { type: String },
    userAgent:   { type: String },
  },
  { timestamps: true }
);

auditLogSchema.index({ actorUserId: 1, createdAt: -1 });
auditLogSchema.index({ action: 1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
