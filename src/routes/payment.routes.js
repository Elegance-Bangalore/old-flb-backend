const router = require("express").Router();
const { verifyJwtToken } = require("../utils/token.utils");
const ctrl = require("./../controller/payment.controller");

// create order
router.post("/checkout",verifyJwtToken, ctrl.checkout);
router.post("/createOrder",verifyJwtToken, ctrl.createOrder);
router.post("/paymentVerification", ctrl.paymentVerification);
router.post("/upgradeSubscription", verifyJwtToken, ctrl.upgradeSubscription);
router.post(
  "/downgradeSubscription",
  verifyJwtToken,
  ctrl.downgradeSubscription
);
router.post(
  "/cancelSubscription",
  verifyJwtToken,
  ctrl.cancelSubscription
);

// Create Razorpay plans (for testing)
router.post("/createPlans", ctrl.createAllPlans);

// Test Razorpay connectivity
router.get("/testRazorpay", ctrl.testRazorpay);

module.exports = router;
