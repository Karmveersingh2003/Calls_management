const AdminCall = require('../models/AdminCall');
const AuditLog = require('../models/AuditLog');
const { logAudit } = require('../utils/auditLogger');

const scopeQuery = (req, q = {}) => {
  if (req.user.role !== 'admin') q.userId = req.user._id;
  return q;
};

const auditValue = (value) => value instanceof Date ? value.toISOString().slice(0, 10) : String(value ?? '');

exports.getAdminCalls = async (req, res, next) => {
  try {
    const { search, category, status } = req.query;
    let q = scopeQuery(req, {});
    if (category) q.category = category;
    if (status) q.status = status;
    if (search) {
      q.$or = [
        { locationName: { $regex: search, $options: 'i' } },
        { issue: { $regex: search, $options: 'i' } },
        { solution: { $regex: search, $options: 'i' } }
      ];
    }
    const data = await AdminCall.find(q).sort({ startDate: -1 });
    res.status(200).json({ success: true, data });
  } catch (err) { next(err); }
};

exports.createAdminCall = async (req, res, next) => {
  try {
    const { locationName, issue, solution, startDate, endDate, timeStart, timeEnd, category, status } = req.body;
    const now = new Date();
    const sTime = timeStart || now.toTimeString().slice(0, 5);
    const eTime = timeEnd || new Date(now.getTime() + 5 * 60 * 1000).toTimeString().slice(0, 5);

    const call = await AdminCall.create({
      userId: req.user._id,
      location: locationName, issue, solution,
      startDate: startDate || now, endDate: endDate || now,
      timeStart: sTime, timeEnd: eTime,
      category: category || 'hardware', status: status || 'done', createdBy: req.user._id
    });
    await logAudit({
      req, action: 'CREATE', entityType: 'AdminCall', entityId: call._id,
      metadata: { summary: `${call.location} - ${call.issue}` }
    });
    res.status(201).json({ success: true, data: call });
  } catch (err) { next(err); }
};

exports.updateAdminCall = async (req, res, next) => {
  try {
    const { locationName, issue, solution, startDate, endDate, timeStart, timeEnd, category, status } = req.body;
    const q = scopeQuery(req, { _id: req.params.id });
    const call = await AdminCall.findOne(q);
    if (!call) return res.status(404).json({ success: false, message: 'Not found' });
    const fields = { location: locationName, issue, solution, startDate, endDate, timeStart, timeEnd, category, status };
    const changes = Object.entries(fields)
      .filter(([field, value]) => auditValue(call[field]) !== auditValue(value))
      .map(([field, value]) => ({ field, from: auditValue(call[field]), to: auditValue(value) }));
    call.set({ ...fields, updatedBy: req.user._id });
    await call.save();
    if (changes.length) {
      await logAudit({ req, action: 'UPDATE', entityType: 'AdminCall', entityId: call._id, metadata: { changes } });
    }
    res.status(200).json({ success: true, data: call });
  } catch (err) { next(err); }
};

exports.deleteAdminCall = async (req, res, next) => {
  try {
    const q = scopeQuery(req, { _id: req.params.id });
    const call = await AdminCall.findOne(q);
    if (!call) return res.status(404).json({ success: false, message: 'Not found' });
    await call.deleteOne();
    await logAudit({
      req, action: 'DELETE', entityType: 'AdminCall', entityId: call._id,
      metadata: { summary: `${call.location} - ${call.issue}` }
    });
    res.status(200).json({ success: true, message: 'Deleted' });
  } catch (err) { next(err); }
};

exports.getAdminCallHistory = async (req, res, next) => {
  try {
    const call = await AdminCall.findOne(scopeQuery(req, { _id: req.params.id }))
      .populate('createdBy', 'name username')
      .populate('updatedBy', 'name username');
    if (!call) return res.status(404).json({ success: false, message: 'Not found' });
    const history = await AuditLog.find({ entityType: 'AdminCall', entityId: call._id })
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
        metadata: { summary: `${call.location} - ${call.issue}` }
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