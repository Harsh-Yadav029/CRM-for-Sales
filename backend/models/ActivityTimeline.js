const mongoose = require('mongoose');

const activityTimelineSchema = new mongoose.Schema(
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
      default: null
    },
    activityType: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    relatedDocuments: [
      {
        name: String,
        url: String
      }
    ],
    relatedTasks: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Task'
      }
    ]
  },
  {
    timestamps: true
  }
);

activityTimelineSchema.index({ clientType: 1, clientId: 1 });
activityTimelineSchema.index({ projectId: 1 });
activityTimelineSchema.index({ timestamp: -1 });

module.exports = mongoose.model('ActivityTimeline', activityTimelineSchema);
