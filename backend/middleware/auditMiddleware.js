const mongoose = require('mongoose');
const AuditLog = require('../models/AuditLog');

/**
 * Audit Logging middleware for SOC2/Enterprise compliance.
 * Captures write actions (POST, PUT, DELETE) and writes audits asynchronously.
 * @param {string} moduleName - Module name (e.g. 'Lead', 'Quote', 'Invoice')
 */
const auditLogMiddleware = (moduleName) => {
  return async (req, res, next) => {
    // Only capture write actions (POST, PUT, DELETE)
    if (!['POST', 'PUT', 'DELETE'].includes(req.method)) {
      return next();
    }

    const originalJson = res.json;
    res.json = function (body) {
      // Restore standard json response behaviour
      res.json = originalJson;
      res.json.call(this, body);

      // Perform audit insertion asynchronously outside response loop
      setImmediate(async () => {
        try {
          // Verify request was successful
          if (res.statusCode >= 200 && res.statusCode < 300) {
            let action = 'CREATE';
            if (req.method === 'PUT') action = 'UPDATE';
            if (req.method === 'DELETE') action = 'DELETE';

            const targetId = req.params.id || body?._id;
            const actorId = req.user?._id || null;

            // Sanitize sensitive fields (e.g. passwords, secrets) from changes audit
            const changes = { ...req.body };
            delete changes.password;
            delete changes.token;

            const validTargetId = targetId && mongoose.isValidObjectId(targetId) ? targetId : null;

            await AuditLog.create({
              changedBy: actorId,
              action,
              resourceType: moduleName,
              targetId: validTargetId,
              newValue: req.method === 'DELETE' ? { deleted: true } : changes,
              oldValue: null
            });
          }
        } catch (err) {
          console.error('[Audit Logger] Failed to save audit entry:', err.message);
        }
      });
    };

    next();
  };
};

module.exports = auditLogMiddleware;
