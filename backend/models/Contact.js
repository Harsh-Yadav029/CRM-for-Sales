const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      default: null
    },
    firstName: {
      type: String,
      required: true,
      trim: true
    },
    lastName: {
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
      default: ''
    },
    title: {
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
contactSchema.index({ tenantId: 1, companyId: 1 });
contactSchema.index({ tenantId: 1, email: 1 });

// Full text search index
contactSchema.index({ 
  firstName: 'text', 
  lastName: 'text', 
  email: 'text' 
}, {
  weights: {
    lastName: 10,
    firstName: 5,
    email: 3
  },
  name: "ContactTextIndex"
});

module.exports = mongoose.model('Contact', contactSchema);
