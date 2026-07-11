const mongoose = require('mongoose');

const quoteItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  price: {
    type: Number,
    required: true,
    min: 0
  }
});

const quoteSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true
    },
    contactId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Contact',
      default: null
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    items: [quoteItemSchema],
    total: {
      type: Number,
      required: true,
      default: 0
    },
    status: {
      type: String,
      enum: ['draft', 'sent', 'accepted', 'declined'],
      default: 'draft'
    },
    validUntil: {
      type: Date,
      required: true
    }
  },
  {
    timestamps: true
  }
);

// Auto-calculate quote totals before saving
quoteSchema.pre('save', function (next) {
  if (this.items && this.items.length > 0) {
    this.total = this.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  } else {
    this.total = 0;
  }
  next();
});

module.exports = mongoose.model('Quote', quoteSchema);
