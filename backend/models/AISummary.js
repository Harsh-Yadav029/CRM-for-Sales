const mongoose = require('mongoose');

const aiSummarySchema = new mongoose.Schema(
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
    budget: {
      type: Number,
      default: 0
    },
    services: {
      type: [String],
      default: []
    },
    meetingSummary: {
      type: String,
      default: ''
    },
    projectCompletion: {
      type: Number,
      default: 0
    },
    pendingApprovals: {
      type: [String],
      default: []
    },
    nextAction: {
      type: String,
      default: ''
    },
    projectHealthScore: {
      type: Number,
      default: 80,
      min: 0,
      max: 100
    },
    delayPrediction: {
      type: String,
      default: 'Low Risk'
    },
    clientSatisfactionScore: {
      type: Number,
      default: 90,
      min: 0,
      max: 100
    },
    nextBestAction: {
      type: String,
      default: ''
    },
    executiveSuggestions: {
      type: [String],
      default: []
    }
  },
  {
    timestamps: true
  }
);

aiSummarySchema.index({ clientId: 1 });
aiSummarySchema.index({ projectId: 1 });

module.exports = mongoose.model('AISummary', aiSummarySchema);
