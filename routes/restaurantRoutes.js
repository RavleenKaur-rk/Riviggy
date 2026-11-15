// ============================================================
//  routes/restaurantRoutes.js
// ============================================================

const router = require("express").Router();
const { listRestaurants, getMenu, getOrderLogs, clearLogs } = require("../controllers/restaurantController");

// GET    /restaurants             — list all restaurants
// GET    /restaurants/logs        — view streamed order history (2️⃣ File Streaming)
// DELETE /restaurants/logs        — clear log file             (1️⃣ fs.unlinkSync)
// GET    /menu/:restaurantId      — get menu for a restaurant

router.get   ("/",              listRestaurants);
router.get   ("/logs",          getOrderLogs);
router.delete("/logs",          clearLogs);
router.get   ("/menu/:restaurantId", getMenu);

module.exports = router;

// NOTE: /menu/:restaurantId is registered under /restaurants in server.js
// so the full URL is GET /restaurants/menu/:restaurantId
// For convenience, a direct GET /menu/:id route is also registered below
