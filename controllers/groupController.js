// ============================================================
//  controllers/groupController.js
//  👥 Group Order — create, join, get, lock, delete
// ============================================================

const { v4: uuidv4 } = require("uuid");
const {
  createOrder,
  getOrderByCode,
  updateOrder,
  deleteOrder,
  getOrders,
  getMenuByRestaurant,
  logOrderEvent,
} = require("../utils/fileHandler");
const { itemBasedSplit, equalSplit } = require("../utils/billSplitter");

// ── Helpers ───────────────────────────────────────────────────

/** Generate a 6-char alphanumeric group code */
function generateGroupCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// ── POST /group/create ────────────────────────────────────────
function createGroup(req, res) {
  const { userId, restaurantId, lockAfterMinutes = 30, splitType = "item" } = req.body;

  if (!userId || !restaurantId) {
    return res.status(400).json({ error: "userId and restaurantId are required" });
  }

  // Validate restaurant exists
  const menu = getMenuByRestaurant(restaurantId);
  if (!menu) {
    return res.status(404).json({ error: `Restaurant '${restaurantId}' not found` });
  }

  const groupCode = generateGroupCode();
  const now       = new Date().toISOString();

  const newOrder = {
    groupCode,
    restaurant     : restaurantId,
    createdBy      : userId,
    users          : [{ userId, joinedAt: now }],
    items          : [],
    payments       : [],
    status         : "open",        // open | locked | paid | placed
    splitType,                       // item | equal
    totalAmount    : 0,
    lockAfterMinutes,
    createdAt      : now,
    lockedAt       : null,
  };

  const ok = createOrder(newOrder);
  if (!ok) return res.status(500).json({ error: "Failed to save order" });

  logOrderEvent(`CREATED group=${groupCode} by=${userId} restaurant=${restaurantId}`);

  res.status(201).json({
    message   : "Group order created successfully!",
    groupCode,
    order     : newOrder,
  });
}

// ── POST /group/join ──────────────────────────────────────────
function joinGroup(req, res) {
  const { userId, groupCode } = req.body;

  if (!userId || !groupCode) {
    return res.status(400).json({ error: "userId and groupCode are required" });
  }

  const order = getOrderByCode(groupCode);
  if (!order) return res.status(404).json({ error: "Group not found" });

  if (order.status !== "open") {
    return res.status(400).json({ error: `Cannot join — order is ${order.status}` });
  }

  const alreadyJoined = order.users.some((u) => u.userId === userId);
  if (alreadyJoined) {
    return res.status(400).json({ error: "User already in this group" });
  }

  updateOrder(groupCode, (o) => ({
    ...o,
    users: [...o.users, { userId, joinedAt: new Date().toISOString() }],
  }));

  logOrderEvent(`JOINED group=${groupCode} user=${userId}`);

  res.json({
    message   : `${userId} joined group ${groupCode}`,
    groupCode,
    restaurant: order.restaurant,
  });
}

// ── GET /group/:code ──────────────────────────────────────────
function getGroup(req, res) {
  const { code } = req.params;
  const { splitView } = req.query; // ?splitView=equal  or ?splitView=item

  const order = getOrderByCode(code);
  if (!order) return res.status(404).json({ error: "Group not found" });

  let billBreakdown = null;
  if (splitView === "equal") {
    billBreakdown = equalSplit(order);
  } else if (splitView === "item" || splitView) {
    billBreakdown = itemBasedSplit(order);
  }

  res.json({ order, billBreakdown });
}

// ── PATCH /group/lock ─────────────────────────────────────────
function lockGroup(req, res) {
  const { groupCode, userId } = req.body;

  if (!groupCode) return res.status(400).json({ error: "groupCode is required" });

  const order = getOrderByCode(groupCode);
  if (!order) return res.status(404).json({ error: "Group not found" });

  if (order.status !== "open") {
    return res.status(400).json({ error: `Order already ${order.status}` });
  }

  // Only creator can manually lock
  if (order.createdBy !== userId) {
    return res.status(403).json({ error: "Only the group creator can lock the order" });
  }

  updateOrder(groupCode, (o) => ({
    ...o,
    status  : "locked",
    lockedAt: new Date().toISOString(),
  }));

  logOrderEvent(`MANUALLY LOCKED group=${groupCode} by=${userId}`);

  const updated = getOrderByCode(groupCode);
  res.json({ message: "Order locked successfully", order: updated });
}

// ── DELETE /group/:code ───────────────────────────────────────
function removeGroup(req, res) {
  const { code }  = req.params;
  const { userId } = req.body;

  const order = getOrderByCode(code);
  if (!order) return res.status(404).json({ error: "Group not found" });

  if (order.createdBy !== userId) {
    return res.status(403).json({ error: "Only the group creator can delete the group" });
  }

  if (["paid", "placed"].includes(order.status)) {
    return res.status(400).json({ error: "Cannot delete a paid/placed order" });
  }

  deleteOrder(code);
  logOrderEvent(`DELETED group=${code} by=${userId}`);

  res.json({ message: `Group ${code} deleted successfully` });
}

// ── GET /group (all orders — admin/debug) ─────────────────────
function getAllGroups(req, res) {
  const orders = getOrders();
  res.json({ total: orders.length, orders });
}

module.exports = { createGroup, joinGroup, getGroup, lockGroup, removeGroup, getAllGroups };
