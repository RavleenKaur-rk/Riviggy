// ============================================================
//  controllers/userController.js
//  👤 User Authentication — signup, login, logout, profile
// ============================================================

const { signUp, login, logout, getUserByToken } = require("../utils/authHandler");

// ── POST /auth/signup ────────────────────────────────────────
function registerUser(req, res) {
  const { name, email, password } = req.body;

  const result = signUp(name, email, password);

  if (result.error) {
    return res.status(400).json({ error: result.error });
  }

  res.status(201).json({
    message: "Signup successful",
    user: result,
  });
}

// ── POST /auth/login ─────────────────────────────────────────
function loginUser(req, res) {
  const { email, password } = req.body;

  const result = login(email, password);

  if (result.error) {
    return res.status(401).json({ error: result.error });
  }

  res.status(200).json({
    message: "Login successful",
    user: result,
    token: result.token,
  });
}

// ── POST /auth/logout ────────────────────────────────────────
function logoutUser(req, res) {
  const token = req.headers.authorization?.replace("Bearer ", "");

  if (!token) {
    return res.status(400).json({ error: "No token provided" });
  }

  logout(token);

  res.status(200).json({
    message: "Logout successful",
  });
}

// ── GET /auth/profile ────────────────────────────────────────
function getProfile(req, res) {
  const token = req.headers.authorization?.replace("Bearer ", "");

  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  const user = getUserByToken(token);

  if (!user) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }

  res.status(200).json({
    user,
  });
}

// ── Module Exports ───────────────────────────────────────────

module.exports = {
  registerUser,
  loginUser,
  logoutUser,
  getProfile,
};
