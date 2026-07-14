const mongoose = require('mongoose');

const whatsappMessageSchema = new mongoose.Schema(
  {
    message: {
      type: String,
      required: true
    },
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
    status: {
      type: String,
      enum: ['sent', 'delivered', 'read'],
      default: 'sent'
    },
    time: {
      type: Date,
      default: Date.now
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

whatsappMessageSchema.index({ clientId: 1 });
whatsappMessageSchema.index({ projectId: 1 });

module.exports = mongoose.model('WhatsappMessage', whatsappMessageSchema);
