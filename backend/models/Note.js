const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['Sales', 'Architect', 'Project', 'Manager', 'Support'],
      default: 'Sales'
    },
    text: {
      type: String,
      required: true
    },
    clientType: {
      type: String,
      enum: ['Lead', 'Contact'],
      required: true
    },
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'clientType',
      required: true
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      default: null
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  {
    timestamps: true
  }
);

noteSchema.index({ clientId: 1 });
noteSchema.index({ projectId: 1 });

module.exports = mongoose.model('Note', noteSchema);
