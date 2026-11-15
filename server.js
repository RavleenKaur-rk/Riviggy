// ============================================================
//  Riviggy — Group Food Ordering System
//  server.js  (Entry Point)
// ===============================/=============================

const express = require("express");
const cors = require("cors");
const path = require("path");

const groupRoutes = require("./routes/groupRoutes");
const orderRoutes = require("./routes/orderRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const restaurantRoutes = require("./routes/restaurantRoutes");
const userRoutes = require("./routes/userRoutes");

const { initDataFiles } = require("./utils/fileHandler");
const { startOrderLockWatcher } = require("./utils/lockWatcher");
const { initSessionsFile } = require("./utils/authHandler");

const app = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── 4️⃣  Serve Static Files ───────────────────────────────────
app.use(express.static("public"));           // serves /public/**
app.use("/assets", express.static(path.join(__dirname, "public/assets")));

// ── Routes ────────────────────────────────────────────────────
app.use("/auth",        userRoutes);
app.use("/group",       groupRoutes);
app.use("/order",       orderRoutes);
app.use("/payment",     paymentRoutes);
app.use("/restaurants", restaurantRoutes);

// Convenience alias: GET /menu/:restaurantId → same as /restaurants/menu/:restaurantId
const { getMenu } = require("./controllers/restaurantController");
app.get("/menu/:restaurantId", getMenu);

// ── Health Check ─────────────────────────────────────────────
app.get("/", (req, res) => {
  res.json({
    message: "🍔 Welcome to Riviggy API",
    version: "1.0.0",
    endpoints: {
      signup      : "POST auth/signup",
      login       : "POST /auth/login",
      logout      : "POST /auth/logout",
      profile     : "GET  /auth/profile",
      restaurants : "GET  /restaurants",
      menu        : "GET  /menu/:restaurantId",
      createGroup : "POST /group/create",
      joinGroup   : "POST /group/join",
      addItem     : "POST /order/add-item",
      updateItem  : "PUT  /order/update-item",
      pay         : "POST /payment/pay",
      getGroup    : "GET  /group/:code",
      lockGroup   : "PATCH /group/lock",
      deleteGroup : "DELETE /group/:code",
      clearLogs   : "DELETE /restaurants/logs",
    },
  });
});

// ── 404 Handler ───────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// ── Global Error Handler ──────────────────────────────────────
app.use((err, req, res, _next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error", details: err.message });
});

// ── Bootstrap ─────────────────────────────────────────────────
initDataFiles();          // create JSON files if they don't exist
initSessionsFile();       // initialize sessions file for authentication
startOrderLockWatcher();  // auto-lock orders after timeout

app.listen(PORT, () => {
  console.log(`\n🚀 Riviggy server running at http://localhost:${PORT}`);
  console.log(`📁 Static files served from /public`);
  console.log(`⏰ Auto-lock watcher started\n`);
});

module.exports = app;
