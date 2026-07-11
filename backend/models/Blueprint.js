const mongoose = require('mongoose');

const transitionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  fromStage: {
    type: String,
    required: true
  },
  toStage: {
    type: String,
    required: true
  },
  requiredFields: {
    type: [String],
    default: [] // Array of lead field paths (e.g. 'phone', 'customFields.budget') required before transition
  }
});

const blueprintSchema = new mongoose.Schema(
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
    pipelineId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Pipeline',
      required: true
    },
    transitions: [transitionSchema],
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

// Enforce unique blueprint names per tenant
blueprintSchema.index({ tenantId: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Blueprint', blueprintSchema);
