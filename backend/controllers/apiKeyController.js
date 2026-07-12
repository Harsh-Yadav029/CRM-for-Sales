const ApiKey = require('../models/ApiKey');
const crypto = require('crypto');

// @desc    Get all API keys for tenant
// @route   GET /api/apikeys
// @access  Private (Admin only)
const getApiKeys = async (req, res, next) => {
  try {
    const keys = await ApiKey.find({ tenantId: req.tenantId }).populate('createdBy', 'name email');
    res.json(keys);
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new API key prefix wtp_
// @route   POST /api/apikeys
// @access  Private (Admin only)
const createApiKey = async (req, res, next) => {
  const { name } = req.body;
  if (!name || !name.trim()) {
    res.status(400);
    return next(new Error('API key name is required'));
  }

  try {
    const secretKey = `wtp_${crypto.randomBytes(24).toString('hex')}`;
    const newKey = await ApiKey.create({
      tenantId: req.tenantId,
      name: name.trim(),
      key: secretKey,
      createdBy: req.user._id
    });

    res.status(201).json(newKey);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete/Revoke API key
// @route   DELETE /api/apikeys/:id
// @access  Private (Admin only)
const revokeApiKey = async (req, res, next) => {
  try {
    const key = await ApiKey.findOneAndDelete({ _id: req.params.id, tenantId: req.tenantId });
    if (!key) {
      res.status(404);
      return next(new Error('API key not found'));
    }
    res.json({ message: 'API key revoked successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getApiKeys,
  createApiKey,
  revokeApiKey
};
