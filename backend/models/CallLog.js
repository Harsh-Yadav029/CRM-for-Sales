const mongoose = require('mongoose');

const callLogSchema = new mongoose.Schema(
  {
    duration: {
      type: Number,
      default: 0
    },
    executiveName: {
      type: String,
      required: true,
      trim: true
    },
    notes: {
      type: String,
      default: ''
    },
    status: {
      type: String,
      enum: ['completed', 'missed', 'busy', 'no-answer'],
      default: 'completed'
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    clientType: {
      type: String,
      enum: ['Lead', 'Contact'],
      required: true
    },
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'clientType',
      required: true
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      default: null
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  {
    timestamps: true
  }
);

callLogSchema.index({ clientId: 1 });
callLogSchema.index({ projectId: 1 });

module.exports = mongoose.model('CallLog', callLogSchema);
