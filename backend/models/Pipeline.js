const mongoose = require('mongoose');

const pipelineSchema = new mongoose.Schema(
  {
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

pipelineSchema.index({ name: 1 }, { unique: true });

module.exports = mongoose.model('Pipeline', pipelineSchema);
