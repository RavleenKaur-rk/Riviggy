// ============================================================
//  routes/userRoutes.js
//  🔐 User Authentication Routes
// ============================================================

const express = require("express");
const router = express.Router();

const {
  registerUser,
  loginUser,
  logoutUser,
  getProfile,
} = require("../controllers/userController");

// ── Public Routes ─────────────────────────────────────────────

/** POST /auth/signup - Create a new user */
router.post("/signup", registerUser);

/** POST /auth/login - Login and get session token */
router.post("/login", loginUser);

/** POST /auth/logout - Logout user */
router.post("/logout", logoutUser);

/** GET /auth/profile - Get current user profile */
router.get("/profile", getProfile);

// ──────────────────────────────────────────────────────────────

module.exports = router;
