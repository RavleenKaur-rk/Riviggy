// ============================================================
//  controllers/restaurantController.js
//  🏪 Restaurants & Menu
// ============================================================

const {
  getRestaurants,
  getMenuByRestaurant,
  readOrderLogs,
  clearLogFile,
} = require("../utils/fileHandler");

// ── GET /restaurants ──────────────────────────────────────────
function listRestaurants(req, res) {
  const restaurants = getRestaurants();
  res.json({ total: restaurants.length, restaurants });
}

// ── GET /menu/:restaurantId ───────────────────────────────────
function getMenu(req, res) {
  const { restaurantId } = req.params;
  const { category }     = req.query; // ?category=pizza

  const menu = getMenuByRestaurant(restaurantId);
  if (!menu) {
    return res.status(404).json({ error: `No menu found for '${restaurantId}'` });
  }

  const filtered = category
    ? menu.filter((item) => item.category?.toLowerCase() === category.toLowerCase())
    : menu;

  const categories = [...new Set(menu.map((i) => i.category))];

  res.json({
    restaurantId,
    totalItems  : filtered.length,
    categories,
    menu        : filtered,
  });
}

// ── GET /restaurants/logs ─────────────────────────────────────
async function getOrderLogs(req, res) {
  try {
    const logs = await readOrderLogs();
    res.json({ total: logs.length, logs });
  } catch (err) {
    res.status(500).json({ error: "Failed to read logs", details: err.message });
  }
}

// ── DELETE /restaurants/logs ───────────────────────────────────
// 1️⃣  Demonstrates fs.unlinkSync — actual file deletion
function clearLogs(req, res) {
  const deleted = clearLogFile();
  if (deleted) {
    res.json({ message: "Log file deleted successfully" });
  } else {
    res.json({ message: "No log file to delete" });
  }
}

module.exports = { listRestaurants, getMenu, getOrderLogs, clearLogs };
