const mongoose = require('mongoose');

const invoiceItemSchema = new mongoose.Schema({
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

const invoiceSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true
    },
    quoteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Quote',
      default: null
    },
    invoiceNumber: {
      type: String,
      required: true,
      trim: true
    },
    items: [invoiceItemSchema],
    total: {
      type: Number,
      required: true,
      default: 0
    },
    status: {
      type: String,
      enum: ['unpaid', 'paid', 'overdue'],
      default: 'unpaid'
    },
    dueDate: {
      type: Date,
      required: true
    }
  },
  {
    timestamps: true
  }
);

// Auto-calculate invoice totals before saving
invoiceSchema.pre('save', function (next) {
  if (this.items && this.items.length > 0) {
    this.total = this.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  } else {
    this.total = 0;
  }
  next();
});

invoiceSchema.index({ invoiceNumber: 1 }, { unique: true });

module.exports = mongoose.model('Invoice', invoiceSchema);
