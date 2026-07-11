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
      required: true
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
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true
    },
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

// Performance compound indexes
leadSchema.index({ tenantId: 1, createdAt: -1 });
leadSchema.index({ tenantId: 1, status: 1 });
leadSchema.index({ tenantId: 1, assignedTo: 1 });

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
