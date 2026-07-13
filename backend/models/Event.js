const mongoose = require('mongoose');

const participantSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  rsvpStatus: {
    type: String,
    enum: ['pending', 'accepted', 'declined'],
    default: 'pending'
  }
});

const eventSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true
    },
    type: {
      type: String,
      enum: ['meeting', 'call', 'internal'],
      required: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      default: ''
    },
    startTime: {
      type: Date,
      required: true
    },
    endTime: {
      type: Date,
      required: true
    },
    timezone: {
      type: String,
      default: 'UTC'
    },
    relatedTo: {
      module: {
        type: String,
        enum: ['Lead', 'Contact', 'Deal', 'Account'],
        required: false
      },
      recordId: {
        type: mongoose.Schema.Types.ObjectId,
        required: false
      }
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    participants: [participantSchema],
    location: {
      type: String,
      default: ''
    },
    conferenceLink: {
      type: String,
      default: ''
    },
    colorTag: {
      type: String,
      enum: ['gold', 'success', 'warning', 'danger', 'neutral'],
      default: 'neutral'
    },
    recurrence: {
      frequency: {
        type: String,
        enum: ['none', 'daily', 'weekly', 'monthly'],
        default: 'none'
      },
      interval: {
        type: Number,
        default: 1
      },
      endDate: {
        type: Date,
        required: false
      }
    },
    reminders: [
      {
        minutesBefore: { type: Number, required: true },
        channel: { type: String, enum: ['email', 'push'], required: true }
      }
    ],
    status: {
      type: String,
      enum: ['scheduled', 'completed', 'cancelled'],
      default: 'scheduled'
    },
    twilioCallSid: {
      type: String,
      default: ''
    },
    recordingUrl: {
      type: String,
      default: ''
    },
    recordingDuration: {
      type: Number,
      default: 0
    },
    disposition: {
      type: String,
      enum: ['interested', 'no_answer', 'call_back_later', 'not_interested', 'wrong_number', 'other'],
      required: false
    },
    direction: {
      type: String,
      enum: ['inbound', 'outbound'],
      required: false
    },
    externalSync: {
      provider: {
        type: String,
        enum: ['none', 'google', 'outlook'],
        default: 'none'
      },
      externalEventId: {
        type: String,
        default: ''
      },
      lastSyncedAt: {
        type: Date,
        required: false
      }
    }
  },
  {
    timestamps: true
  }
);

// Performance compound index matching query patterns
eventSchema.index({ tenantId: 1, assignedTo: 1, startTime: 1 });

module.exports = mongoose.model('Event', eventSchema);
