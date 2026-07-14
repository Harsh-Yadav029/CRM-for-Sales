const mongoose = require('mongoose');

const emailSchema = new mongoose.Schema(
  {
    subject: {
      type: String,
      required: true,
      trim: true
    },
    body: {
      type: String,
      required: true
    },
    attachments: [
      {
        name: String,
        url: String
      }
    ],
    sender: {
      type: String,
      required: true,
      trim: true
    },
    receiver: {
      type: String,
      required: true,
      trim: true
    },
    sentTime: {
      type: Date,
      default: Date.now
    },
    deliveredTime: {
      type: Date,
      default: null
    },
    readTime: {
      type: Date,
      default: null
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

emailSchema.index({ clientId: 1 });
emailSchema.index({ projectId: 1 });

module.exports = mongoose.model('Email', emailSchema);
