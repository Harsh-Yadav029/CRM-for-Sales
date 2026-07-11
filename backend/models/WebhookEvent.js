const mongoose = require('mongoose');

const webhookEventSchema = new mongoose.Schema(
  {
    eventId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    provider: {
      type: String,
      required: true
    },
    processedAt: {
      type: Date,
      default: Date.now,
      expires: '7d' // Auto-expire logs after 7 days
    }
  }
);

module.exports = mongoose.model('WebhookEvent', webhookEventSchema);
