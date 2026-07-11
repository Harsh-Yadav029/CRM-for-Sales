const mongoose = require('mongoose');

const quotaSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    year: {
      type: Number,
      required: true
    },
    quarter: {
      type: Number,
      enum: [1, 2, 3, 4],
      required: true
    },
    targetAmount: {
      type: Number,
      required: true,
      min: 0
    },
    attainedAmount: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  {
    timestamps: true
  }
);

// Enforce unique quota periods per sales representative
quotaSchema.index({ tenantId: 1, userId: 1, year: 1, quarter: 1 }, { unique: true });

module.exports = mongoose.model('Quota', quotaSchema);
