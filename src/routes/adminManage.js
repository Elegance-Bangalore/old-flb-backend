const express = require("express");
const router = express.Router();

const { verifyJwtToken } = require("../utils/token.utils");

const ctrl = require("../controller/adminManage");

router.get("/getBuyers", verifyJwtToken, ctrl.getAllBuyers);
router.get("/getRecently", ctrl.getRecentlyAddedProperties);

// admin manage subscription
router.post("/manageSubscription/:sellerId", ctrl.adminManageSubscription)

module.exports = router