const AuditLog = require('../models/AuditLog');

// @desc    Retrieve all audit log activities for the current tenant
// @route   GET /api/audits
// @access  Private (Admin only)
const getAuditLogs = async (req, res, next) => {
  try {
    const logs = await AuditLog.find({ tenantId: req.tenantId })
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });
    res.json(logs);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAuditLogs
};
