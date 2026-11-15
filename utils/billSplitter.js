// ============================================================
//  utils/billSplitter.js
//  🧮 Bill Splitting Logic
// ============================================================

/**
 * ITEM-BASED SPLIT (default)
 * Each user pays only for items they added.
 * Returns: { userId -> { items, subtotal } }
 */
function itemBasedSplit(order) {
  const bills = {};

  order.items.forEach((item) => {
    const uid = item.addedBy;
    if (!bills[uid]) {
      bills[uid] = { userId: uid, items: [], subtotal: 0 };
    }
    bills[uid].items.push(item);
    bills[uid].subtotal = +(bills[uid].subtotal + item.price * item.quantity).toFixed(2);
  });

  return bills;
}

/**
 * EQUAL SPLIT
 * Total divided equally among all users in the group.
 * Returns: { userId -> { amount } }
 */
function equalSplit(order) {
  const total   = order.totalAmount;
  const users   = order.users;
  const perHead = +(total / users.length).toFixed(2);

  const bills = {};
  users.forEach((user, idx) => {
    const uid = typeof user === "string" ? user : user.userId;
    // distribute rounding remainder to first user
    bills[uid] = {
      userId: uid,
      amount: idx === 0 ? +(total - perHead * (users.length - 1)).toFixed(2) : perHead,
    };
  });

  return bills;
}

/**
 * Compute total amount from all items in the order
 */
function computeTotal(items) {
  return +items
    .reduce((sum, item) => sum + item.price * item.quantity, 0)
    .toFixed(2);
}

module.exports = { itemBasedSplit, equalSplit, computeTotal };
