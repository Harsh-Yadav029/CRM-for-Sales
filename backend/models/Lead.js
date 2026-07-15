const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: true
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: function () {
        return !this.addedBySystem;
      }
    },
    addedBySystem: {
      type: Boolean,
      default: false
    },
    type: {
      type: String,
      enum: ['note', 'call', 'email'],
      default: 'note'
    },
    subject: {
      type: String,
      default: ''
    },
    duration: {
      type: Number, // in seconds (for calls)
      default: 0
    },
    status: {
      type: String, // e.g., 'completed', 'missed', 'sent'
      default: ''
    }
  },
  {
    timestamps: true
  }
);

const leadSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    company: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    },
    phone: {
      type: String,
      required: true,
      trim: true
    },
    source: {
      type: String,
      default: 'Website'
    },
    status: {
      type: String,
      enum: ['New', 'Contacted', 'Demo Scheduled', 'Proposal Sent', 'Negotiation', 'Won', 'Lost'],
      default: 'New'
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    expectedRevenue: {
      type: Number,
      default: 0
    },
    serviceCategory: {
      type: String,
      enum: ['Interior VR', 'Elevation VR', 'Full-Scale 3D', 'Plan Conversion', 'Other'],
      default: 'Interior VR'
    },
    showroomBookingSlot: {
      type: Date,
      default: null
    },
    designDrawingStatus: {
      type: String,
      enum: ['Pending', 'In Progress', 'Approved', 'Rejected'],
      default: 'Pending'
    },
    showroomMeetingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      default: null
    },
    customFields: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: {}
    },
    notes: [noteSchema]
  },
  {
    timestamps: true
  }
);

// Auto-create/update showroom meeting Event when showroomBookingSlot is modified
leadSchema.pre('save', async function (next) {
  if (this.isModified('showroomBookingSlot')) {
    const Event = mongoose.model('Event');
    if (this.showroomBookingSlot) {
      const newStart = new Date(this.showroomBookingSlot);
      const newEnd = new Date(newStart.getTime() + 60 * 60 * 1000); // 1 hour duration

      if (this.showroomMeetingId) {
        // Use updateOne to bypass pre-save hooks on Event and prevent infinite loops
        await Event.updateOne(
          { _id: this.showroomMeetingId },
          {
            $set: {
              startTime: newStart,
              endTime: newEnd
            }
          }
        );
      } else {
        // Create new Event
        const newStart = new Date(this.showroomBookingSlot);
        const newEnd = new Date(newStart.getTime() + 60 * 60 * 1000);
        const newEvent = await Event.create({
          type: 'meeting',
          title: `Showroom Meeting - ${this.name}`,
          startTime: newStart,
          endTime: newEnd,
          relatedTo: { module: 'Lead', recordId: this._id },
          assignedTo: this.assignedTo || (await mongoose.model('User').findOne({}))?._id
        });
        this.showroomMeetingId = newEvent._id;
      }
    } else {
      // Slot set to null - delete the event if it exists
      if (this.showroomMeetingId) {
        await Event.deleteOne({ _id: this.showroomMeetingId });
        this.showroomMeetingId = null;
      }
    }
  }
  next();
});

// Performance compound indexes
leadSchema.index({ createdAt: -1 });
leadSchema.index({ status: 1 });
leadSchema.index({ assignedTo: 1 });

// Full text search index
leadSchema.index({ 
  name: 'text', 
  company: 'text', 
  email: 'text', 
  phone: 'text' 
}, {
  weights: {
    name: 10,
    company: 5,
    email: 3,
    phone: 1
  },
  name: "LeadTextIndex"
});

module.exports = mongoose.model('Lead', leadSchema);
