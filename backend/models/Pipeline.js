const mongoose = require('mongoose');

const pipelineSchema = new mongoose.Schema(
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
    stages: {
      type: [String],
      required: true,
      default: ['Discovery', 'Proposal', 'Negotiation', 'Won', 'Lost']
    },
    description: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

// Enforce unique pipeline names per tenant
pipelineSchema.index({ tenantId: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Pipeline', pipelineSchema);
