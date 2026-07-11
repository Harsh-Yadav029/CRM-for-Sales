const Tenant = require('../models/Tenant');

/**
 * Tenant scoping middleware: Sets req.tenantId based on authenticated user session or x-tenant-id header.
 */
const tenantMiddleware = async (req, res, next) => {
  try {
    let tenantId = null;

    // 1. Resolve from authenticated user object (bound by authMiddleware)
    if (req.user && req.user.tenantId) {
      tenantId = req.user.tenantId.toString();
    } 
    // 2. Fallback to custom request header (useful during client-side registration/setup)
    else if (req.headers['x-tenant-id']) {
      tenantId = req.headers['x-tenant-id'];
    }

    if (!tenantId) {
      // For public/non-tenant specific routes, skip validation, else block
      const isPublicRoute = ['/api/auth/login', '/api/auth/register', '/api/auth/forgot-password', '/api/auth/reset-password', '/api/health'].some(path => req.path.startsWith(path));
      if (isPublicRoute) {
        return next();
      }
      return res.status(400).json({ message: 'Tenant identifier is required for this operation' });
    }

    // Verify Tenant exists in database
    const tenantExists = await Tenant.findById(tenantId);
    if (!tenantExists) {
      return res.status(404).json({ message: 'Tenant organization not found or inactive' });
    }

    req.tenantId = tenantId;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = tenantMiddleware;
