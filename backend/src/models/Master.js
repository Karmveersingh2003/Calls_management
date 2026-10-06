const mongoose = require('mongoose');

// Generic master collection for: location, issue, solution, guestIssue, guestCategory, byWho
const masterSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      enum: ['location', 'issue', 'solution', 'guestIssue', 'guestCategory', 'byWho'],
    },
    name:     { type: String, required: true, trim: true },
    scope:    { type: String, enum: ['global', 'user'], default: 'global' },
    ownerId:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

masterSchema.index({ type: 1, isActive: 1 });
masterSchema.index({ type: 1, scope: 1, ownerId: 1 });

module.exports = mongoose.model('Master', masterSchema);
