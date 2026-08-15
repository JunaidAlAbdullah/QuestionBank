const { verifyToken } = require('../utils/jwt');

// Requires a valid JWT. Populates req.user with { id, role, username }.
function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ success: false, message: 'Authentication required.' });
  }

  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    return next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired session.' });
  }
}

// Does not fail if there's no token, but attaches req.user when a valid one exists.
// Used on public routes that still want to know "is someone logged in".
function optionalAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) return next();

  try {
    req.user = verifyToken(token);
  } catch (err) {
    // ignore invalid token on optional routes
  }
  return next();
}

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Admin access required.' });
  }
  return next();
}

module.exports = { requireAuth, optionalAuth, requireAdmin };
