// ============================================================
//  controllers/paymentController.js
//  💳 Mock Payment — individual pay, status, auto-place order
// ============================================================

const { v4: uuidv4 } = require("uuid");
const {
  getOrderByCode,
  updateOrder,
  addPayment,
  getPaymentsByCode,
  updatePayment,
  logOrderEvent,
} = require("../utils/fileHandler");
const { itemBasedSplit, equalSplit } = require("../utils/billSplitter");

// ── POST /payment/pay ─────────────────────────────────────────
function pay(req, res) {
  const { groupCode, userId, method = "UPI" } = req.body;

  if (!groupCode || !userId) {
    return res.status(400).json({ error: "groupCode and userId are required" });
  }

  const order = getOrderByCode(groupCode);
  if (!order) return res.status(404).json({ error: "Group not found" });

  if (!["locked", "open"].includes(order.status)) {
    return res.status(400).json({
      error: `Cannot pay — order status is '${order.status}'`,
    });
  }

  // Check user is in the group
  const inGroup = order.users.some((u) => u.userId === userId);
  if (!inGroup) {
    return res.status(403).json({ error: "You are not part of this group" });
  }

  // Calculate how much this user owes
  const split   = order.splitType === "equal"
    ? equalSplit(order)
    : itemBasedSplit(order);

  const userBill = split[userId];
  if (!userBill) {
    return res.status(400).json({
      error: "No items found for this user. Add items before paying.",
    });
  }
  const amountDue =
    order.splitType === "equal" ? userBill.amount : userBill.subtotal;

  // Check if already paid
  const existing = getPaymentsByCode(groupCode).find(
    (p) => p.userId === userId && p.status === "paid"
  );
  if (existing) {
    return res.status(400).json({ error: "You have already paid for this order" });
  }

  // ── Mock Payment Processing ──────────────────────────────────
  // In production: integrate Razorpay / Stripe here
  const paymentRecord = {
    paymentId  : uuidv4(),
    groupCode,
    userId,
    amount     : amountDue,
    method,      // UPI | Card | Wallet | Cash
    status     : "paid",
    paidAt     : new Date().toISOString(),
    transactionRef: `TXN-${Date.now()}`,
  };

  addPayment(paymentRecord);

  // Update payments array inside order too
  updateOrder(groupCode, (o) => ({
    ...o,
    payments: [
      ...o.payments.filter((p) => p.userId !== userId),
      { userId, status: "paid", amount: amountDue },
    ],
  }));

  logOrderEvent(
    `PAYMENT group=${groupCode} user=${userId} amount=₹${amountDue} method=${method}`
  );

  // ── Check if all paying users have paid ──────────────────────
  const updatedOrder    = getOrderByCode(groupCode);
  const paidUserIds     = updatedOrder.payments
    .filter((p) => p.status === "paid")
    .map((p) => p.userId);

  // For equal split, ALL users must pay; for item-based, only users who added items
  const requiredPayers = updatedOrder.splitType === "equal"
    ? updatedOrder.users.map((u) => u.userId)
    : [...new Set(updatedOrder.items.map((i) => i.addedBy))];
  const allPaid = requiredPayers.every((uid) => paidUserIds.includes(uid));

  if (allPaid && updatedOrder.status !== "placed") {
    updateOrder(groupCode, (o) => ({
      ...o,
      status  : "placed",
      placedAt: new Date().toISOString(),
    }));
    logOrderEvent(`ORDER PLACED group=${groupCode} total=₹${updatedOrder.totalAmount}`);
  }

  res.json({
    message      : "Payment successful! 🎉",
    payment      : paymentRecord,
    orderStatus  : allPaid ? "placed" : updatedOrder.status,
    allPaid,
  });
}

// ── GET /payment/status/:code ─────────────────────────────────
function getPaymentStatus(req, res) {
  const { code } = req.params;

  const order = getOrderByCode(code);
  if (!order) return res.status(404).json({ error: "Group not found" });

  const payments = getPaymentsByCode(code);
  const split    = order.splitType === "equal"
    ? equalSplit(order)
    : itemBasedSplit(order);

  // For equal split, ALL users owe money; for item-based, only users who added items
  const payingUsers = order.splitType === "equal"
    ? order.users.map((u) => (typeof u === "string" ? u : u.userId))
    : [...new Set(order.items.map((i) => i.addedBy))];

  const summary = payingUsers.map((uid) => {
    const bill    = split[uid];
    const paid    = payments.find((p) => p.userId === uid && p.status === "paid");
    const amtDue  = order.splitType === "equal" ? bill?.amount : bill?.subtotal;
    return {
      userId   : uid,
      amountDue: amtDue || 0,
      paid     : !!paid,
      paidAt   : paid?.paidAt || null,
      method   : paid?.method || null,
    };
  });

  const totalCollected = summary
    .filter((s) => s.paid)
    .reduce((sum, s) => sum + s.amountDue, 0);

  const totalRemaining = summary
    .filter((s) => !s.paid)
    .reduce((sum, s) => sum + s.amountDue, 0);

  res.json({
    groupCode       : code,
    orderStatus     : order.status,
    totalAmount     : order.totalAmount,
    totalCollected  : +totalCollected.toFixed(2),
    totalRemaining  : +totalRemaining.toFixed(2),
    splitType       : order.splitType,
    paymentSummary  : summary,
  });
}

// ── GET /payment/bill/:code/:userId ───────────────────────────
function getUserBill(req, res) {
  const { code, userId } = req.params;

  const order = getOrderByCode(code);
  if (!order) return res.status(404).json({ error: "Group not found" });

  const inGroup = order.users.some((u) => u.userId === userId);
  if (!inGroup) return res.status(403).json({ error: "User not in group" });

  const itemSplit = itemBasedSplit(order);
  const eqSplit   = equalSplit(order);

  const userItems    = itemSplit[userId]?.items || [];
  const itemSubtotal = itemSplit[userId]?.subtotal || 0;
  const equalShare   = eqSplit[userId]?.amount || 0;

  const payment = getPaymentsByCode(code).find(
    (p) => p.userId === userId && p.status === "paid"
  );

  res.json({
    groupCode     : code,
    userId,
    restaurant    : order.restaurant,
    yourItems     : userItems,
    itemSubtotal,
    equalShare,
    activeAmount  : order.splitType === "equal" ? equalShare : itemSubtotal,
    splitType     : order.splitType,
    paid          : !!payment,
    paymentDetails: payment || null,
  });
}

module.exports = { pay, getPaymentStatus, getUserBill };
