const mongoose = require('mongoose');

const guestCallSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },

    roomNo: { type: String, required: true, trim: true },

    issue:        { type: String, required: true },
    issueMasterId: { type: mongoose.Schema.Types.ObjectId, ref: 'Master' },

    solution:        { type: String, required: true },
    solutionMasterId: { type: mongoose.Schema.Types.ObjectId, ref: 'Master' },

    timeStart: { type: String, required: true },
    timeEnd:   { type: String, required: true },

    category: { type: String, default: 'WiFi' },

    byWho:   { type: String, required: true },
    byWhoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Master' },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

guestCallSchema.index({ userId: 1, createdAt: -1 });
guestCallSchema.index({ userId: 1, category: 1 });
guestCallSchema.index({ userId: 1, roomNo: 1 });

module.exports = mongoose.model('GuestCall', guestCallSchema);
