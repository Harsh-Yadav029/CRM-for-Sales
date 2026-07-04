const CustomField = require('../models/CustomField');

// @desc    Get all custom field definitions
// @route   GET /api/custom-fields
// @access  Private
const getCustomFields = async (req, res, next) => {
  try {
    const fields = await CustomField.find({});
    res.json(fields);
  } catch (error) {
    next(error);
  }
};

// @desc    Define new custom field rule
// @route   POST /api/custom-fields
// @access  Private/Admin
const createCustomField = async (req, res, next) => {
  const { fieldName, fieldType, options } = req.body;

  try {
    if (!fieldName || !fieldType) {
      res.status(400);
      return next(new Error('Field name and type are required'));
    }

    // Verify uniqueness
    const exists = await CustomField.findOne({ fieldName });
    if (exists) {
      res.status(400);
      return next(new Error(`Custom field with name "${fieldName}" already defined`));
    }

    const field = await CustomField.create({
      fieldName,
      fieldType,
      options: options || []
    });

    res.status(201).json(field);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete custom field rule
// @route   DELETE /api/custom-fields/:id
// @access  Private/Admin
const deleteCustomField = async (req, res, next) => {
  try {
    const field = await CustomField.findById(req.params.id);
    if (!field) {
      res.status(404);
      return next(new Error('Custom field definition not found'));
    }

    await CustomField.deleteOne({ _id: field._id });
    res.json({ message: 'Custom field definition removed successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCustomFields,
  createCustomField,
  deleteCustomField
};
