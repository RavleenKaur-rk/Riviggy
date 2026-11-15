// ============================================================
//  utils/authHandler.js
//  🔐 User Authentication — signup, login, session management
// ============================================================

const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");

const USERS_FILE = path.join(__dirname, "../data/users.json");
const SESSIONS_FILE = path.join(__dirname, "../data/sessions.json");

// ── Helper Functions ──────────────────────────────────────────

/** Read JSON file */
function readJSON(filePath) {
  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(raw);
  } catch (err) {
    console.error(`[authHandler] readJSON error (${filePath}):`, err.message);
    return null;
  }
}

/** Write JSON file */
function writeJSON(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
    return true;
  } catch (err) {
    console.error(`[authHandler] writeJSON error (${filePath}):`, err.message);
    return false;
  }
}

/** Initialize sessions file if it doesn't exist */
function initSessionsFile() {
  if (!fs.existsSync(SESSIONS_FILE)) {
    writeJSON(SESSIONS_FILE, []);
  }
}

// ── User Management ───────────────────────────────────────────

/**
 * Sign up a new user
 * @returns {object} user object or error
 */
function signUp(name, email, password) {
  // Validate input
  if (!name || !email || !password) {
    return { error: "Name, email, and password are required" };
  }

  if (password.length < 4) {
    return { error: "Password must be at least 4 characters" };
  }

  // Check if email already exists
  const users = readJSON(USERS_FILE) || [];
  if (users.some((u) => u.email === email)) {
    return { error: "Email already registered" };
  }

  // Create new user
  const newUser = {
    id: `user_${uuidv4().split("-")[0]}`,
    name,
    email,
    password, // In production, this should be hashed!
    createdAt: new Date().toISOString(),
  };

  users.push(newUser);
  if (writeJSON(USERS_FILE, users)) {
    console.log(`[authHandler] User signed up: ${email}`);
    // Return user without password
    const { password, ...userWithoutPassword } = newUser;
    return userWithoutPassword;
  }

  return { error: "Failed to create user" };
}

/**
 * Login user
 * @returns {object} user object with session token or error
 */
function login(email, password) {
  // Validate input
  if (!email || !password) {
    return { error: "Email and password are required" };
  }

  // Find user
  const users = readJSON(USERS_FILE) || [];
  const user = users.find((u) => u.email === email && u.password === password);

  if (!user) {
    return { error: "Invalid email or password" };
  }

  // Create session token
  const token = uuidv4();
  const sessions = readJSON(SESSIONS_FILE) || [];
  sessions.push({
    token,
    userId: user.id,
    email: user.email,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
  });

  if (writeJSON(SESSIONS_FILE, sessions)) {
    console.log(`[authHandler] User logged in: ${email}`);
    // Return user without password + token
    const { password, ...userWithoutPassword } = user;
    return { ...userWithoutPassword, token };
  }

  return { error: "Login failed" };
}

/**
 * Get user by session token
 * @returns {object} user object or null
 */
function getUserByToken(token) {
  if (!token) return null;

  const sessions = readJSON(SESSIONS_FILE) || [];
  const session = sessions.find((s) => s.token === token);

  if (!session) return null;

  // Check expiration
  if (new Date(session.expiresAt) < new Date()) {
    // Remove expired session
    const updated = sessions.filter((s) => s.token !== token);
    writeJSON(SESSIONS_FILE, updated);
    return null;
  }

  // Get user
  const users = readJSON(USERS_FILE) || [];
  const user = users.find((u) => u.id === session.userId);

  if (user) {
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  return null;
}

/**
 * Logout user (remove session)
 */
function logout(token) {
  const sessions = readJSON(SESSIONS_FILE) || [];
  const updated = sessions.filter((s) => s.token !== token);
  writeJSON(SESSIONS_FILE, updated);
  console.log(`[authHandler] Session removed: ${token.substring(0, 8)}`);
}

/**
 * Get all users (admin only)
 */
function getAllUsers() {
  const users = readJSON(USERS_FILE) || [];
  // Return without passwords
  return users.map(({ password, ...user }) => user);
}

// ── Module Exports ────────────────────────────────────────────

module.exports = {
  initSessionsFile,
  signUp,
  login,
  logout,
  getUserByToken,
  getAllUsers,
};
