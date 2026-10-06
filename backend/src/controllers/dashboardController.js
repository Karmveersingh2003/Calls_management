const AdminCall = require('../models/AdminCall');
const GuestCall = require('../models/GuestCall');

exports.getStats = async (req, res, next) => {
  try {
    const q = req.user.role !== 'admin' ? { userId: req.user._id } : {};
    const [totalAdminCalls, totalGuestCalls, pendingCalls, completedCalls] = await Promise.all([
      AdminCall.countDocuments(q),
      GuestCall.countDocuments(q),
      AdminCall.countDocuments({ ...q, status: 'pending' }),
      AdminCall.countDocuments({ ...q, status: 'done' })
    ]);
    res.status(200).json({
      success: true,
      data: { totalAdminCalls, totalGuestCalls, todayTotalCalls: totalAdminCalls + totalGuestCalls, pendingCalls, completedCalls }
    });
  } catch (err) { next(err); }
};