const express = require("express");
const router = express.Router();

const { verifyJwtToken } = require("../utils/token.utils");
const ctrl = require("../controller/developerAnalytics");


router.get("/developerAnalytics", verifyJwtToken, ctrl.developerAnalytics);
router.post("/updateFeaturedOrder", verifyJwtToken, ctrl.updateFeaturedOrder);
router.post("/autoAssignFeaturedOrder", verifyJwtToken, ctrl.autoAssignFeaturedOrder);
module.exports = router