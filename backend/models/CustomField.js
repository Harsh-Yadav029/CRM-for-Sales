const mongoose = require('mongoose');

const customFieldSchema = new mongoose.Schema(
  {
    fieldName: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    fieldType: {
      type: String,
      enum: ['text', 'number', 'select', 'date'],
      required: true
    },
    options: {
      type: [String],
      default: []
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('CustomField', customFieldSchema);
