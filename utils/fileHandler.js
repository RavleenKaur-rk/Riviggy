// ============================================================
//  utils/fileHandler.js
//  1️⃣  File Module (fs) — CRUD on JSON files
//  2️⃣  File Streaming   — read/write order logs
// ============================================================

const fs   = require("fs");
const path = require("path");

// ── File Paths ────────────────────────────────────────────────
const DATA_DIR = path.join(__dirname, "../data");

const FILES = {
  restaurants : path.join(DATA_DIR, "restaurants.json"),
  menus       : path.join(DATA_DIR, "menus.json"),
  orders      : path.join(DATA_DIR, "orders.json"),
  payments    : path.join(DATA_DIR, "payments.json"),
};

const LOG_FILE = path.join(__dirname, "../logs/order_history.log");

// ── Helpers ───────────────────────────────────────────────────

/** 1️⃣ READ — synchronous JSON read */
function readJSON(filePath) {
  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(raw);
  } catch (err) {
    console.error(`[fileHandler] readJSON error (${filePath}):`, err.message);
    return null;
  }
}

/** 1️⃣ WRITE — synchronous JSON write */
function writeJSON(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
    return true;
  } catch (err) {
    console.error(`[fileHandler] writeJSON error (${filePath}):`, err.message);
    return false;
  }
}

// ── Public API ────────────────────────────────────────────────

/** READ all restaurants */
function getRestaurants() {
  return readJSON(FILES.restaurants) || [];
}

/** READ menu for a specific restaurant */
function getMenuByRestaurant(restaurantId) {
  const menus = readJSON(FILES.menus) || {};
  return menus[restaurantId] || null;
}

/** READ all orders */
function getOrders() {
  return readJSON(FILES.orders) || [];
}

/** READ single order by group code */
function getOrderByCode(code) {
  const orders = getOrders();
  return orders.find((o) => o.groupCode === code) || null;
}

/** 1️⃣ CREATE — append new order */
function createOrder(order) {
  const orders = getOrders();
  orders.push(order);
  return writeJSON(FILES.orders, orders);
}

/** 1️⃣ UPDATE — modify existing order */
function updateOrder(code, updater) {
  const orders = getOrders();
  const idx = orders.findIndex((o) => o.groupCode === code);
  if (idx === -1) return false;
  orders[idx] = { ...orders[idx], ...updater(orders[idx]) };
  return writeJSON(FILES.orders, orders);
}

/** 1️⃣ DELETE — remove order */
function deleteOrder(code) {
  const orders = getOrders();
  const filtered = orders.filter((o) => o.groupCode !== code);
  if (filtered.length === orders.length) return false;
  return writeJSON(FILES.orders, filtered);
}

// ── Payment Store ─────────────────────────────────────────────

function getPayments() {
  return readJSON(FILES.payments) || [];
}

function addPayment(payment) {
  const payments = getPayments();
  payments.push(payment);
  return writeJSON(FILES.payments, payments);
}

function getPaymentsByCode(groupCode) {
  return getPayments().filter((p) => p.groupCode === groupCode);
}

function updatePayment(groupCode, userId, updater) {
  const payments = getPayments();
  const idx = payments.findIndex(
    (p) => p.groupCode === groupCode && p.userId === userId
  );
  if (idx === -1) return false;
  payments[idx] = { ...payments[idx], ...updater(payments[idx]) };
  return writeJSON(FILES.payments, payments);
}

// ── 1️⃣  APPEND — fs.appendFileSync ───────────────────────────

/**
 * APPEND — append a log entry synchronously using fs.appendFileSync.
 * Demonstrates Node.js file module "append" operation.
 */
function appendLog(event) {
  const entry = `[${new Date().toISOString()}] ${event}\n`;
  const logsDir = path.dirname(LOG_FILE);
  if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });
  fs.appendFileSync(LOG_FILE, entry, "utf-8");
}

// ── 1️⃣  DELETE — fs.unlinkSync ───────────────────────────────

/**
 * DELETE FILE — remove the log file from disk using fs.unlinkSync.
 * Demonstrates Node.js file module "delete" operation.
 */
function clearLogFile() {
  if (fs.existsSync(LOG_FILE)) {
    fs.unlinkSync(LOG_FILE);
    return true;
  }
  return false;
}

// ── 2️⃣  File Streaming ───────────────────────────────────────

/**
 * STREAM WRITE — append a log entry for order events.
 * Uses a writable stream so large logs are handled efficiently.
 */
function logOrderEvent(event) {
  const entry = `[${new Date().toISOString()}] ${event}\n`;

  // Ensure logs directory exists
  const logsDir = path.dirname(LOG_FILE);
  if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });

  const writeStream = fs.createWriteStream(LOG_FILE, { flags: "a" });
  writeStream.write(entry, (err) => {
    if (err) console.error("[fileHandler] log write error:", err.message);
    writeStream.end();
  });
}

/**
 * STREAM READ — stream order history log line-by-line.
 * Returns a promise that resolves with all log lines.
 * Uses a readable stream to handle potentially large log files.
 */
function readOrderLogs() {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(LOG_FILE)) return resolve([]);

    const lines  = [];
    let   buffer = "";

    const readStream = fs.createReadStream(LOG_FILE, { encoding: "utf-8" });

    readStream.on("data", (chunk) => {
      buffer += chunk;
      const parts = buffer.split("\n");
      buffer = parts.pop(); // keep incomplete line in buffer
      parts.forEach((line) => line.trim() && lines.push(line));
    });

    readStream.on("end", () => {
      if (buffer.trim()) lines.push(buffer.trim());
      resolve(lines);
    });

    readStream.on("error", reject);
  });
}

// ── Init — create data files if missing ──────────────────────

function initDataFiles() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    console.log("[fileHandler] Created /data directory");
  }

  // Seed restaurants if file missing
  if (!fs.existsSync(FILES.restaurants)) {
    const seed = require("../data/seed/restaurants.json");
    writeJSON(FILES.restaurants, seed);
    console.log("[fileHandler] Seeded restaurants.json");
  }

  // Seed menus if file missing
  if (!fs.existsSync(FILES.menus)) {
    const seed = require("../data/seed/menus.json");
    writeJSON(FILES.menus, seed);
    console.log("[fileHandler] Seeded menus.json");
  }

  // Create empty orders / payments if missing
  if (!fs.existsSync(FILES.orders))   writeJSON(FILES.orders, []);
  if (!fs.existsSync(FILES.payments)) writeJSON(FILES.payments, []);

  console.log("[fileHandler] Data files ready ✅");
}

module.exports = {
  initDataFiles,
  getRestaurants,
  getMenuByRestaurant,
  getOrders,
  getOrderByCode,
  createOrder,
  updateOrder,
  deleteOrder,
  getPayments,
  addPayment,
  getPaymentsByCode,
  updatePayment,
  appendLog,
  logOrderEvent,
  readOrderLogs,
  clearLogFile,
};
