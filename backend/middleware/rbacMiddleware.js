/**
 * Role-Based Access Control middleware: Checks if req.user has a role included in allowedRoles.
 * Allowed roles: 'admin', 'manager', 'rep'
 * @param {Array<string>} allowedRoles
 */
const checkRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication is required' });
    }

    const { role } = req.user;
    if (!allowedRoles.includes(role)) {
      return res.status(403).json({ 
        message: `Forbidden: Access restricted. Required permissions not met for role: ${role}` 
      });
    }

    next();
  };
};

module.exports = { checkRole };
