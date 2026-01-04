const express = require("express");
const router = express.Router();

const ctrl = require("../controller/banner");
const { verifyJwtToken, verifyOptionalJwtToken } = require("../utils/token.utils");

router.post("/addBanner", verifyJwtToken, ctrl.addBanner);
router.put("/editBanner/:bannerId", verifyJwtToken, ctrl.updateBanner);
router.get("/getBanners", verifyOptionalJwtToken, ctrl.getBanners);
router.get("/viewBanners/:bannerId", verifyOptionalJwtToken, ctrl.viewBanner);
router.delete("/deleteBanner/:bannerId", verifyJwtToken, ctrl.deleteBanner);

//listing page banners
router.get("/getTopBanners", ctrl.getTopBanners);
router.get("/getDetailBanners", ctrl.geDetailPageBanners);
router.get("/getMidBanners", ctrl.getMidBanners);
router.get("/getradiusProperties", ctrl.radiusProperties);

module.exports = router