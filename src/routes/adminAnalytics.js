const router = require("express").Router();
const { verifyJwtToken } = require("../utils/token.utils");

const ctrl = require("../controller/adminAnalytics");

router.get("/getAnalytics", verifyJwtToken, ctrl.getAnalytics);
router.get("/sellerAnalytics", verifyJwtToken, ctrl.sellerAnalytics);

//properties add by
router.get("/propertiesAddBy", ctrl.getPropertyAddBy);

//subscription analytics
router.get("/subscriptionAnalytics", ctrl.SubscriptionAnalytics);



module.exports = router;
