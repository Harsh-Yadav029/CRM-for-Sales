const mongoose = require('mongoose');

const tenantSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    subscriptionLevel: {
      type: String,
      enum: ['free', 'growth', 'enterprise'],
      default: 'free'
    },
    domain: {
      type: String,
      default: ''
    },
    settings: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Tenant', tenantSchema);
