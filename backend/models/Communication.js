const mongoose = require('mongoose');

const communicationSchema = new mongoose.Schema(
  {
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
    },
    type: {
      type: String,
      enum: ['email', 'whatsapp', 'call', 'meeting', 'note'],
      required: true
    },
    refId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    summary: {
      type: String,
      default: ''
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

communicationSchema.index({ clientType: 1, clientId: 1 });
communicationSchema.index({ projectId: 1 });
communicationSchema.index({ timestamp: -1 });

module.exports = mongoose.model('Communication', communicationSchema);
