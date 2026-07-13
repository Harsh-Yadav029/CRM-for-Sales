const mongoose = require('mongoose');

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
      default: 'meeting',
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
      required: true,
      default: 'UTC'
    },
    relatedTo: {
      module: {
        type: String,
        enum: ['Lead', 'Contact', 'Deal', 'Account']
      },
      recordId: {
        type: mongoose.Schema.Types.ObjectId
      }
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    participants: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User'
        },
        email: {
          type: String,
          required: true
        },
        name: {
          type: String,
          required: true
        },
        rsvpStatus: {
          type: String,
          enum: ['pending', 'accepted', 'declined'],
          default: 'pending'
        }
      }
    ],
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
        type: Date
      }
    },
    reminders: [
      {
        minutesBefore: {
          type: Number,
          required: true
        },
        channel: {
          type: String,
          enum: ['email', 'push'],
          default: 'email'
        }
      }
    ],
    status: {
      type: String,
      enum: ['scheduled', 'completed', 'cancelled'],
      default: 'scheduled'
    },
    externalSync: {
      provider: {
        type: String,
        enum: ['none', 'google', 'outlook'],
        default: 'none'
      },
      externalEventId: {
        type: String
      },
      lastSyncedAt: {
        type: Date
      }
    }
  },
  {
    timestamps: true
  }
);

// Compound index matching query patterns for scoped calendar views
eventSchema.index({ tenantId: 1, assignedTo: 1, startTime: 1 });

module.exports = mongoose.model('Event', eventSchema);
