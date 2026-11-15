// ============================================================
//  routes/paymentRoutes.js
// ============================================================

const router = require("express").Router();
const { pay, getPaymentStatus, getUserBill } = require("../controllers/paymentController");

// POST /payment/pay              — user pays their share
// GET  /payment/status/:code     — get payment summary for group
// GET  /payment/bill/:code/:uid  — get individual user bill

router.post("/pay",                   pay);
router.get ("/status/:code",          getPaymentStatus);
router.get ("/bill/:code/:userId",    getUserBill);

module.exports = router;
