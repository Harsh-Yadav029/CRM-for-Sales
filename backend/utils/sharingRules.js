const User = require('../models/User');

/**
 * Recursively fetches all subordinate user IDs for a given manager ID.
 * @param {string} userId - The manager user ID
 * @returns {Promise<Array<string>>}
 */
const getSubordinateIds = async (userId) => {
  let list = [];
  const directReports = await User.find({ reportsTo: userId }).select('_id');
  for (const report of directReports) {
    list.push(report._id.toString());
    const recursiveReports = await getSubordinateIds(report._id);
    list = list.concat(recursiveReports);
  }
  return list;
};

/**
 * Builds a Mongoose query that scopes data visibility based on user roles and reporting hierarchies.
 * - Admin: view all records in tenant
 * - Manager: view own records + all records owned by subordinates
 * - Rep: view only own records
 * @param {Object} req - Express request
 * @returns {Promise<Object>} Mongoose query filter
 */
const buildLeadSharingQuery = async (req) => {
  const query = { tenantId: req.tenantId };
  
  if (req.user.role === 'admin') {
    return query; // Admins see everything within their tenant
  }
  
  if (req.user.role === 'manager') {
    const subordinates = await getSubordinateIds(req.user._id);
    query.$or = [
      { assignedTo: req.user._id },
      { assignedTo: { $in: subordinates } }
    ];
    return query;
  }
  
  // Reps are locked to their own assigned records
  query.assignedTo = req.user._id;
  return query;
};

module.exports = {
  getSubordinateIds,
  buildLeadSharingQuery
};
