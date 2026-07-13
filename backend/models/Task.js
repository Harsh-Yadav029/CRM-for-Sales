const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
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
    dueDate: {
      type: Date,
      required: true
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
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
      required: true
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
      enum: ['open', 'completed'],
      default: 'open'
    },
    // Keep completed for backwards compatibility with parts of code using completed boolean
    completed: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

// Synchronize completed field and status field on save
taskSchema.pre('save', function (next) {
  if (this.isModified('status')) {
    this.completed = this.status === 'completed';
  } else if (this.isModified('completed')) {
    this.status = this.completed ? 'completed' : 'open';
  }
  next();
});

module.exports = mongoose.model('Task', taskSchema);
