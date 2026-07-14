const mongoose = require('mongoose');

const meetingSchema = new mongoose.Schema(
  {
    meetingType: {
      type: String,
      enum: ['Consultation', 'Client Meeting', 'Design Discussion', 'VR Session', 'AR Session', 'Construction Consultation'],
      default: 'Consultation'
    },
    date: {
      type: Date,
      required: true
    },
    time: {
      type: String,
      required: true
    },
    location: {
      type: String,
      default: ''
    },
    conferenceLink: {
      type: String,
      default: ''
    },
    participants: [
      {
        name: String,
        email: String,
        role: String
      }
    ],
    notes: {
      type: String,
      default: ''
    },
    agenda: {
      type: String,
      default: ''
    },
    attachments: [
      {
        name: String,
        url: String
      }
    ],
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

meetingSchema.index({ clientId: 1 });
meetingSchema.index({ projectId: 1 });

module.exports = mongoose.model('Meeting', meetingSchema);
