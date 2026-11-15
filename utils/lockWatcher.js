// ============================================================
//  utils/lockWatcher.js
//  Polls every minute and auto-locks expired group orders
// ============================================================

const { getOrders, updateOrder, logOrderEvent } = require("./fileHandler");

const LOCK_AFTER_MINUTES = 30; // default lock window
const POLL_INTERVAL_MS   = 60 * 1000; // check every 60 seconds

function checkAndLockOrders() {
  const orders = getOrders();
  const now    = Date.now();

  orders.forEach((order) => {
    if (order.status !== "open") return;

    const createdAt  = new Date(order.createdAt).getTime();
    const lockAfter  = (order.lockAfterMinutes || LOCK_AFTER_MINUTES) * 60 * 1000;
    const expiresAt  = createdAt + lockAfter;

    if (now >= expiresAt) {
      updateOrder(order.groupCode, (o) => ({
        ...o,
        status  : "locked",
        lockedAt: new Date().toISOString(),
      }));
      logOrderEvent(
        `AUTO-LOCKED group=${order.groupCode} restaurant=${order.restaurant}`
      );
      console.log(`[lockWatcher] Auto-locked group: ${order.groupCode}`);
    }
  });
}

function startOrderLockWatcher() {
  console.log(
    `[lockWatcher] Started — checking every ${POLL_INTERVAL_MS / 1000}s`
  );
  setInterval(checkAndLockOrders, POLL_INTERVAL_MS);
  checkAndLockOrders(); // run immediately on start
}

module.exports = { startOrderLockWatcher };
