const mongoose = require('mongoose');

const workflowSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    triggerStage: {
      type: String,
      enum: ['New', 'Contacted', 'Demo Scheduled', 'Proposal Sent', 'Negotiation', 'Won', 'Lost'],
      required: true
    },
    actionType: {
      type: String,
      enum: ['task', 'email'],
      required: true
    },
    // Parameters for Task creation action
    taskTitle: {
      type: String,
      default: ''
    },
    // Parameters for Outgoing Email action
    emailSubject: {
      type: String,
      default: ''
    },
    emailBody: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Workflow', workflowSchema);
