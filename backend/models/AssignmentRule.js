const mongoose = require('mongoose');

const criteriaSchema = new mongoose.Schema({
  field: {
    type: String,
    required: true
  },
  operator: {
    type: String,
    enum: ['equals', 'not_equals', 'contains', 'greater_than', 'less_than'],
    required: true
  },
  value: {
    type: String,
    required: true
  }
});

const assignmentRuleSchema = new mongoose.Schema(
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
    criteria: [criteriaSchema],
    assignees: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ],
    currentIndex: {
      type: Number,
      default: 0
    },
    isActive: {
      type: Boolean,
      default: true
    },
    priority: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('AssignmentRule', assignmentRuleSchema);
