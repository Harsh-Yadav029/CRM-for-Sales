const Tenant = require('../models/Tenant');
const Lead = require('../models/Lead');
const User = require('../models/User');

const PLAN_LIMITS = {
  free: { maxUsers: 3, maxLeads: 100 },
  growth: { maxUsers: 15, maxLeads: 2000 },
  enterprise: { maxUsers: Infinity, maxLeads: Infinity }
};

/**
 * Enforces lead record constraints based on active tenant subscription level.
 */
const checkLeadLimit = async (req, res, next) => {
  try {
    const tenant = await Tenant.findById(req.tenantId);
    const plan = (tenant?.subscriptionLevel || 'free').toLowerCase();
    const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.free;

    if (limits.maxLeads !== Infinity) {
      const currentLeadsCount = await Lead.countDocuments({ tenantId: req.tenantId });
      if (currentLeadsCount >= limits.maxLeads) {
        res.status(403);
        return next(new Error(`Subscription Limit Reached: Your "${plan}" plan permits a maximum of ${limits.maxLeads} leads. Upgrade your plan to create more records.`));
      }
    }
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Enforces user seat constraints based on active tenant subscription level.
 */
const checkUserLimit = async (req, res, next) => {
  try {
    const tenant = await Tenant.findById(req.tenantId);
    const plan = (tenant?.subscriptionLevel || 'free').toLowerCase();
    const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.free;

    if (limits.maxUsers !== Infinity) {
      const currentUsersCount = await User.countDocuments({ tenantId: req.tenantId });
      if (currentUsersCount >= limits.maxUsers) {
        res.status(403);
        return next(new Error(`Subscription Limit Reached: Your "${plan}" plan permits a maximum of ${limits.maxUsers} user seats. Upgrade your plan to invite more teammates.`));
      }
    }
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  checkLeadLimit,
  checkUserLimit
};
