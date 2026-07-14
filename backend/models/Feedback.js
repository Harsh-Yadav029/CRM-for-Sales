const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema(
  {
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    feedbackType: {
      type: String,
      enum: ['VR Experience', 'AR Experience', 'Designs', 'Meetings', 'Services', 'Project Completion'],
      required: true
    },
    comments: {
      type: String,
      default: ''
    },
    revisionRequests: {
      type: [String],
      default: []
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
      default: null
    }
  },
  {
    timestamps: true
  }
);

feedbackSchema.index({ clientId: 1 });
feedbackSchema.index({ projectId: 1 });

module.exports = mongoose.model('Feedback', feedbackSchema);
