// Role / permission middleware. Use after authenticateToken.
const { hasPermission, hasAnyRole } = require('../lib/permissions');

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    if (!hasAnyRole(req.user.role, roles)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
}

function requirePermission(...perms) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    const ok = perms.every(p => hasPermission(req.user.role, p));
    if (!ok) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
}

module.exports = { requireRole, requirePermission };
