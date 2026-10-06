const GuestCall = require('../models/GuestCall');
const AuditLog = require('../models/AuditLog');
const { logAudit } = require('../utils/auditLogger');

const scopeQuery = (req, q = {}) => {
  if (req.user.role !== 'admin') q.userId = req.user._id;
  return q;
};

const auditValue = (value) => value instanceof Date ? value.toISOString().slice(0, 10) : String(value ?? '');

exports.getGuestCalls = async (req, res, next) => {
  try {
    const q = scopeQuery(req, {});
    const data = await GuestCall.find(q).sort({ timeStart: -1 });
    res.status(200).json({ success: true, data });
  } catch (err) { next(err); }
};

exports.createGuestCall = async (req, res, next) => {
  try {
    const { roomNo, issue, solution, timeStart, timeEnd, category = 'WiFi', byWho } = req.body;
    const now = new Date();
    const sTime = timeStart || now.toTimeString().slice(0, 5);
    const eTime = timeEnd || new Date(now.getTime() + 5 * 60 * 1000).toTimeString().slice(0, 5);
    const call = await GuestCall.create({
      userId: req.user._id, roomNo, issue, solution,
      timeStart: sTime, timeEnd: eTime, category, byWho, createdBy: req.user._id
    });
    await logAudit({
      req, action: 'CREATE', entityType: 'GuestCall', entityId: call._id,
      metadata: { summary: `Room ${call.roomNo} - ${call.issue}` }
    });
    res.status(201).json({ success: true, data: call });
  } catch (err) { next(err); }
};

exports.updateGuestCall = async (req, res, next) => {
  try {
    const { roomNo, issue, solution, timeStart, timeEnd, category, byWho } = req.body;
    const q = scopeQuery(req, { _id: req.params.id });
    const call = await GuestCall.findOne(q);
    if (!call) return res.status(404).json({ success: false, message: 'Not found' });
    const fields = { roomNo, issue, solution, timeStart, timeEnd, category, byWho };
    const changes = Object.entries(fields)
      .filter(([field, value]) => auditValue(call[field]) !== auditValue(value))
      .map(([field, value]) => ({ field, from: auditValue(call[field]), to: auditValue(value) }));
    call.set({ ...fields, updatedBy: req.user._id });
    await call.save();
    if (changes.length) {
      await logAudit({ req, action: 'UPDATE', entityType: 'GuestCall', entityId: call._id, metadata: { changes } });
    }
    res.status(200).json({ success: true, data: call });
  } catch (err) { next(err); }
};

exports.deleteGuestCall = async (req, res, next) => {
  try {
    const q = scopeQuery(req, { _id: req.params.id });
    const call = await GuestCall.findOne(q);
    if (!call) return res.status(404).json({ success: false, message: 'Not found' });
    await call.deleteOne();
    await logAudit({
      req, action: 'DELETE', entityType: 'GuestCall', entityId: call._id,
      metadata: { summary: `Room ${call.roomNo} - ${call.issue}` }
    });
    res.status(200).json({ success: true, message: 'Deleted' });
  } catch (err) { next(err); }
};

exports.getGuestCallHistory = async (req, res, next) => {
  try {
    const call = await GuestCall.findOne(scopeQuery(req, { _id: req.params.id }))
      .populate('createdBy', 'name username')
      .populate('updatedBy', 'name username');
    if (!call) return res.status(404).json({ success: false, message: 'Not found' });
    const history = await AuditLog.find({ entityType: 'GuestCall', entityId: call._id })
      .populate('actorUserId', 'name username')
      .sort({ createdAt: -1 })
      .lean();
    const entries = history.map(({ action, createdAt, actorUserId, metadata }) => ({
      action, createdAt, actorName: actorUserId?.name || actorUserId?.username || 'Unknown', metadata
    }));
    if (!history.some(entry => entry.action === 'CREATE') && call.createdBy) {
      entries.push({
        action: 'CREATE', createdAt: call.createdAt,
        actorName: call.createdBy.name || call.createdBy.username || 'Unknown',
        metadata: { summary: `Room ${call.roomNo} - ${call.issue}` }
      });
    }
    if (!history.some(entry => entry.action === 'UPDATE') && call.updatedBy && call.updatedAt > call.createdAt) {
      entries.push({
        action: 'UPDATE', createdAt: call.updatedAt,
        actorName: call.updatedBy.name || call.updatedBy.username || 'Unknown',
        metadata: { summary: 'Last update before call history tracking was enabled.' }
      });
    }
    entries.sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt));
    res.status(200).json({
      success: true,
      data: entries
    });
  } catch (err) { next(err); }
};