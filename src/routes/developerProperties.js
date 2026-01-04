const router = require("express").Router();
const { verifyJwtToken, verifyOptionalJwtToken } = require("./../utils/token.utils");

const ctrl  = require("../controller/developerProperties");

router.get("/properties/:sellerId", verifyOptionalJwtToken, ctrl.developerProperties)
router.get("/details/:sellerId", ctrl.getSellerSpecific)
router.get("/dasboard/:sellerId", ctrl.getSellerdash)
router.get("/dayProperties", ctrl.findDayProperties)

router.get("/counts", verifyJwtToken, ctrl.counts)

router.get("/sellerDash", verifyJwtToken, ctrl.getSellerDashboard)
router.get("/similarProperties/:propertyId", ctrl.similarProperties)


//apis for seo cities
router.post("/addSeoCities", verifyJwtToken, ctrl.addSeoCity)
router.get("/getSeoCities", verifyJwtToken, ctrl.getSeoCity)
router.get("/getpropertType", ctrl.getpropertyTypeSeoCity)
router.put("/updateSeoCity/:seoId", verifyJwtToken, ctrl.updateSeoCity)
router.delete("/deleteSeoCity/:seoId", verifyJwtToken, ctrl.deleteSeoCity)


// properties details for promoted properties
router.get("/selectedDetails", ctrl.getProperties)
router.patch("/markPromoted/:propertyId", verifyJwtToken, ctrl.markPropertyPromoted)
router.patch("/sellerMarkPromoted/:propertyId", verifyJwtToken, ctrl.sellerMarkPropertyPromoted)
router.put("/editPromoted/:propertyId", verifyJwtToken, ctrl.updatePromotedProperty)
router.put("/editSellerPromoted/:propertyId", verifyJwtToken, ctrl.updateSellerPromoted)

//update featured image for property
router.patch("/updateFeaturedImage/:propertyId", ctrl.updateFetauredImage)
module.exports = router;
