// ============================================================
//  controllers/orderController.js
//  🍔 Order items — add, remove, view
// ============================================================

const { v4: uuidv4 } = require("uuid");
const {
  getOrderByCode,
  updateOrder,
  getMenuByRestaurant,
  logOrderEvent,
} = require("../utils/fileHandler");
const { computeTotal } = require("../utils/billSplitter");

// ── POST /order/add-item ──────────────────────────────────────
function addItem(req, res) {
  const { groupCode, userId, menuItemId, quantity = 1, specialInstructions = "" } = req.body;

  if (!groupCode || !userId || !menuItemId) {
    return res
      .status(400)
      .json({ error: "groupCode, userId, and menuItemId are required" });
  }

  const order = getOrderByCode(groupCode);
  if (!order) return res.status(404).json({ error: "Group not found" });

  if (order.status !== "open") {
    return res.status(400).json({ error: `Order is ${order.status} — cannot add items` });
  }

  // Check user is in the group
  const inGroup = order.users.some((u) => u.userId === userId);
  if (!inGroup) {
    return res
      .status(403)
      .json({ error: "You must join the group before adding items" });
  }

  // Find item in menu
  const menu = getMenuByRestaurant(order.restaurant);
  if (!menu) return res.status(404).json({ error: "Menu not found" });

  const menuItem = menu.find((m) => m.id === menuItemId);
  if (!menuItem) {
    return res.status(404).json({ error: `Menu item '${menuItemId}' not found` });
  }

  if (!menuItem.available) {
    return res.status(400).json({ error: `'${menuItem.name}' is currently unavailable` });
  }

  const orderItem = {
    itemId             : uuidv4(),
    menuItemId,
    name               : menuItem.name,
    price              : menuItem.price,
    quantity           : parseInt(quantity, 10),
    specialInstructions,
    addedBy            : userId,
    addedAt            : new Date().toISOString(),
  };

  updateOrder(groupCode, (o) => {
    const updatedItems = [...o.items, orderItem];
    return {
      ...o,
      items      : updatedItems,
      totalAmount: computeTotal(updatedItems),
    };
  });

  logOrderEvent(
    `ADD_ITEM group=${groupCode} user=${userId} item=${menuItem.name} qty=${quantity}`
  );

  const updatedOrder = getOrderByCode(groupCode);
  res.status(201).json({
    message     : `${menuItem.name} added to order`,
    item        : orderItem,
    totalAmount : updatedOrder.totalAmount,
  });
}

// ── DELETE /order/remove-item ─────────────────────────────────
function removeItem(req, res) {
  const { groupCode, userId, itemId } = req.body;

  if (!groupCode || !userId || !itemId) {
    return res.status(400).json({ error: "groupCode, userId, and itemId are required" });
  }

  const order = getOrderByCode(groupCode);
  if (!order) return res.status(404).json({ error: "Group not found" });
  if (order.status !== "open") {
    return res.status(400).json({ error: "Order is locked — cannot remove items" });
  }

  const item = order.items.find((i) => i.itemId === itemId);
  if (!item) return res.status(404).json({ error: "Item not found in order" });

  if (item.addedBy !== userId && order.createdBy !== userId) {
    return res.status(403).json({ error: "You can only remove items you added" });
  }

  updateOrder(groupCode, (o) => {
    const updatedItems = o.items.filter((i) => i.itemId !== itemId);
    return { ...o, items: updatedItems, totalAmount: computeTotal(updatedItems) };
  });

  logOrderEvent(`REMOVE_ITEM group=${groupCode} user=${userId} item=${itemId}`);
  res.json({ message: "Item removed successfully" });
}

// ── GET /order/:code/items ────────────────────────────────────
function getOrderItems(req, res) {
  const { code } = req.params;
  const order    = getOrderByCode(code);
  if (!order) return res.status(404).json({ error: "Group not found" });

  // Group items by user
  const byUser = {};
  order.items.forEach((item) => {
    if (!byUser[item.addedBy]) byUser[item.addedBy] = [];
    byUser[item.addedBy].push(item);
  });

  res.json({
    groupCode  : code,
    totalAmount: order.totalAmount,
    status     : order.status,
    itemsByUser: byUser,
    allItems   : order.items,
  });
}

// ── PUT /order/update-item ─────────────────────────────────
// 5️⃣  Demonstrates the PUT HTTP method (full item update)
function updateItem(req, res) {
  const { groupCode, userId, itemId, quantity, specialInstructions } = req.body;

  if (!groupCode || !userId || !itemId || quantity == null) {
    return res.status(400).json({ error: "groupCode, userId, itemId, and quantity are required" });
  }

  const order = getOrderByCode(groupCode);
  if (!order) return res.status(404).json({ error: "Group not found" });
  if (order.status !== "open") {
    return res.status(400).json({ error: "Order is locked — cannot update items" });
  }

  const item = order.items.find((i) => i.itemId === itemId);
  if (!item) return res.status(404).json({ error: "Item not found in order" });

  if (item.addedBy !== userId && order.createdBy !== userId) {
    return res.status(403).json({ error: "You can only update items you added" });
  }

  const newQty = parseInt(quantity, 10);
  if (newQty < 1) {
    return res.status(400).json({ error: "Quantity must be at least 1" });
  }

  updateOrder(groupCode, (o) => {
    const updatedItems = o.items.map((i) => {
      if (i.itemId !== itemId) return i;
      return {
        ...i,
        quantity: newQty,
        specialInstructions: specialInstructions !== undefined ? specialInstructions : i.specialInstructions,
      };
    });
    return { ...o, items: updatedItems, totalAmount: computeTotal(updatedItems) };
  });

  logOrderEvent(`UPDATE_ITEM group=${groupCode} user=${userId} item=${itemId} qty=${newQty}`);

  const updatedOrder = getOrderByCode(groupCode);
  res.json({
    message: "Item updated successfully",
    totalAmount: updatedOrder.totalAmount,
  });
}

module.exports = { addItem, removeItem, updateItem, getOrderItems };
