const router = require("express").Router();
const ctrl = require("./../controller/seller.controller");
const { verifyJwtToken, verifyOptionalJwtToken } = require("./../utils/token.utils");
const { planValidator } = require("./../validators/auth.validation");
const upload = require("./../utils/multer.utils");

router.get("/profile", verifyJwtToken, ctrl.profile);
// owner profile
router.post(
  "/editProfile",
  verifyJwtToken,
  upload.single("profilePic"),
  ctrl.editProfile
);

// developer profile
router.post(
  "/developerProfile",
  verifyJwtToken,
  upload.single("logo"),
  ctrl.developerProfile
);

router.put(
  "/editDeveloperProfile",
  verifyJwtToken,
  upload.single("logo"),
  ctrl.editDeveloperProfile
);
router.put(
  "/updateprofile",
  verifyJwtToken,
  upload.single("logo"),
  ctrl.updateProfile
);
router.get("/propertyView", verifyOptionalJwtToken, ctrl.getPropertyListing);

router.get("/cities", ctrl.getPropertyCities);
router.post("/saveProperties", verifyJwtToken, ctrl.saveProperties);

// @GET inquiries list
router.get("/inquiryList", verifyJwtToken, ctrl.inquiryList);

// view inquiry list
router.post("/viewInquiry", verifyJwtToken, ctrl.viewInquiry);

// activity tracker api
router.get("/activityTracker", ctrl.activityTracker);

//subscription list
router.get("/planList", ctrl.subscriptionList);

// selecting subscription plan
router.post("/selectPlan", [planValidator], verifyJwtToken, ctrl.selectPlan);

router.post("/upgradePlan", [planValidator], verifyJwtToken, ctrl.upgradePlan);

router.get("/existingPlan", verifyJwtToken, ctrl.existingPlan);

router.get("/cancelSubscription", verifyJwtToken, ctrl.cancelSubscription);

// accept booking request
router.post("/acceptBooking", verifyJwtToken, ctrl.acceptBooking);

// // meeting booking list
router.get("/bookingList", verifyJwtToken, ctrl.bookingList);

// get request raised by buyer
router.get("/vistedRequest", verifyJwtToken, ctrl.getVisitRequests);

//accepting buyer request
router.patch("/vistedRequest/:requestId", verifyJwtToken, ctrl.acceptVisit);

//seller dashboard
router.get("/dashboard/fav", verifyJwtToken, ctrl.sellerDashboardFav);
router.get("/dashboard/counts", verifyJwtToken, ctrl.dashboardCounts);

//for seller get lists of blogs
router.get("/sellerBlogs", verifyJwtToken, ctrl.getblogLists);

// adding other amenities by seller
router.post("/addAmenities", verifyJwtToken, ctrl.addAmenities);

// amenities list seller wise
router.get("/amenityListBySeller", verifyJwtToken, ctrl.amenityListBySeller);

// seller dashboard total properties, total views
router.get(
  "/sellerDashboardTotalProperties",
  verifyJwtToken,
  ctrl.sellerDashboardTotalProperties
);

// total enquiry count
router.get("/totalEnquiryCount", verifyJwtToken, ctrl.totalEnquiryCount);

router.get("/newlyAddedProperty", verifyJwtToken, ctrl.newlyAddedProperty);

// total revenue generated from sales
router.get("/totalRevenueGenerated", verifyJwtToken, ctrl.totalRevenueGenerated);


router.delete("/deletesellerprop/:propertyId", verifyJwtToken, ctrl.deleteSellerProperty);

module.exports = router;
