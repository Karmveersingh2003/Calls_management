const mongoose = require('mongoose');

const adminCallSchema = new mongoose.Schema(
  {
    userId:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },

    locationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Master' },
    location:   { type: String, required: true },

    issue:        { type: String, required: true },
    issueMasterId: { type: mongoose.Schema.Types.ObjectId, ref: 'Master' },

    solution:        { type: String, required: true },
    solutionMasterId: { type: mongoose.Schema.Types.ObjectId, ref: 'Master' },

    startDate: { type: Date, required: true },
    endDate:   { type: Date, required: true },
    timeStart: { type: String, required: true },
    timeEnd:   { type: String, required: true },

    category: { type: String, enum: ['hardware', 'software'], required: true },
    status:   { type: String, enum: ['done', 'pending'], default: 'done' },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

adminCallSchema.index({ userId: 1, startDate: -1 });
adminCallSchema.index({ userId: 1, category: 1 });
adminCallSchema.index({ userId: 1, status: 1 });
adminCallSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('AdminCall', adminCallSchema);
