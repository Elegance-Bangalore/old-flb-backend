const router = require("express").Router();
const { verifyJwtToken } = require("../utils/token.utils");
const ctrl = require("./../controller/user.controller");

router.get("/userPropertyView", ctrl.userPropertyView);

router.get("/trendingProperty", ctrl.trendingProperty);

router.get("/getMasterPlan/:propertyId", ctrl.getMasterPlan);
router.get("/userDetails", verifyJwtToken, ctrl.userDetails);

// share property
router.post("/shareProperty", ctrl.shareProperty);

// newly added property
router.get("/getNewPropertyList", ctrl.getNewPropertyList);

// property details for user
router.get("/getPropertyDetails/:propertyId", ctrl.getPropertyDetails);

module.exports = router;
