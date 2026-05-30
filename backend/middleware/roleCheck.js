// middleware/roleCheck.js
// Usage:  router.post('/route', verifyToken, checkRole('admin'), handler)
//         router.post('/route', verifyToken, checkRole('admin','officer'), handler)

const checkRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated.' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required: ${allowedRoles.join(' or ')}. Your role: ${req.user.role}`
      });
    }
    next();
  };
};

module.exports = checkRole;
