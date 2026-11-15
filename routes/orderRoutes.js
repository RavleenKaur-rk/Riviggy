// ============================================================
//  routes/orderRoutes.js
// ============================================================

const router = require("express").Router();
const { addItem, removeItem, updateItem, getOrderItems } = require("../controllers/orderController");

// POST   /order/add-item       — add a menu item to group order
// PUT    /order/update-item    — update item quantity (5️⃣ PUT method)
// DELETE /order/remove-item    — remove an item from group order
// GET    /order/:code/items    — list all items in an order

router.post  ("/add-item",        addItem);
router.put   ("/update-item",     updateItem);
router.delete("/remove-item",     removeItem);
router.get   ("/:code/items",     getOrderItems);

module.exports = router;
