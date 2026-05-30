// middleware/auth.js
// Verifies JWT token on every protected route.
// Attach token in header:  Authorization: Bearer <token>

const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token      = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No token provided.'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // decoded contains: { user_id, username, role, officer_id, station_id }
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({
      success: false,
      message: 'Invalid or expired token. Please login again.'
    });
  }
};

module.exports = verifyToken;
