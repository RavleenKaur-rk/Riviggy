// ============================================================
//  middleware/authMiddleware.js
//  🔐 Authentication middleware — protect routes
// ============================================================

const { getUserByToken } = require("../utils/authHandler");

/**
 * Middleware to check if user is authenticated
 * Looks for token in Authorization header (Bearer token)
 */
function requireAuth(req, res, next) {
  const token = req.headers.authorization?.replace("Bearer ", "");

  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  const user = getUserByToken(token);

  if (!user) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }

  // Attach user to request
  req.user = user;
  req.token = token;

  next();
}

module.exports = {
  requireAuth,
};
