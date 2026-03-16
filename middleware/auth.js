const jwt = require('jsonwebtoken');

// JWT verification — attaches req.user { id, username, role }
function verifyToken(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }
  try {
    const token = header.split(' ')[1];
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
}

// Optional auth — attaches req.user if token present, otherwise continues
function optionalAuth(req, res, next) {
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) {
    try {
      req.user = jwt.verify(header.split(' ')[1], process.env.JWT_SECRET);
    } catch (err) { /* ignore invalid token */ }
  }
  next();
}

// Admin role check
function requireAdmin(req, res, next) {
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Admin access required.' });
  }
  next();
}

// Leader or Admin role check
function requireLeaderOrAdmin(req, res, next) {
  if (req.user.role !== 'LEADER' && req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Leader or admin access required.' });
  }
  next();
}

module.exports = { verifyToken, optionalAuth, requireAdmin, requireLeaderOrAdmin };
