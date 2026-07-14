const mongoose = require('mongoose');

const companySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    industry: {
      type: String,
      default: ''
    },
    website: {
      type: String,
      default: ''
    },
    phone: {
      type: String,
      default: ''
    },
    address: {
      type: String,
      default: ''
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Performance compound index
companySchema.index({ name: 1 });

// Full text search index
companySchema.index({ 
  name: 'text', 
  industry: 'text' 
}, {
  weights: {
    name: 10,
    industry: 3
  },
  name: "CompanyTextIndex"
});

module.exports = mongoose.model('Company', companySchema);
