const Master = require('../models/Master');

exports.getMasters = async (req, res, next) => {
  try {
    const { type } = req.query;
    const query = { isActive: true };
    if (type) query.type = type;
    if (req.user.role !== 'admin') {
      query.$or = [{ scope: 'global' }, { ownerId: req.user._id }];
    }
    const masters = await Master.find(query).sort({ name: 1 });
    res.status(200).json({ success: true, data: masters });
  } catch (err) { next(err); }
};

exports.createMaster = async (req, res, next) => {
  try {
    const { type, name } = req.body;
    if (!type || !name || !String(name).trim()) {
      return res.status(400).json({ success: false, message: 'Type and name are required' });
    }
    const trimmed = String(name).trim();
    // Case-insensitive duplicate check within the same type (visible scope)
    const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const dupeQuery = { type, name: new RegExp(`^${escaped}$`, 'i'), isActive: true };
    if (req.user.role !== 'admin') dupeQuery.$or = [{ scope: 'global' }, { ownerId: req.user._id }];
    const existing = await Master.findOne(dupeQuery);
    if (existing) return res.status(200).json({ success: true, data: existing });

    const master = await Master.create({
      type, name: trimmed, scope: req.user.role === 'admin' ? 'global' : 'user',
      ownerId: req.user.role === 'admin' ? null : req.user._id, createdBy: req.user._id
    });
    res.status(201).json({ success: true, data: master });
  } catch (err) { next(err); }
};

/* Soft-delete a dropdown entry (admin: any, user: only their own) */
exports.deleteMaster = async (req, res, next) => {
  try {
    const master = await Master.findById(req.params.id);
    if (!master || !master.isActive) {
      return res.status(404).json({ success: false, message: 'Entry not found' });
    }
    const isAdmin = req.user.role === 'admin';
    const isOwner = master.ownerId && String(master.ownerId) === String(req.user._id);
    if (!isAdmin && !isOwner) {
      return res.status(403).json({ success: false, message: 'You can only delete your own entries' });
    }
    master.isActive = false;
    await master.save();
    res.status(200).json({ success: true, message: `"${master.name}" deleted` });
  } catch (err) { next(err); }
};