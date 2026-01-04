const router = require("express").Router();
const { verifyJwtToken, verifyOptionalJwtToken } = require("../utils/token.utils");
const ctrl = require("./../controller/buyer.controller");
const { slotBookValidator } = require("./../validators/buyer.validation");


const {sysLog} = require("../middleware/sysLogs")

// buyer inquiry post
router.post("/postInquiry", verifyOptionalJwtToken, ctrl.postInquiry);

// collect buyers field of interest
router.post("/buyersInterest", verifyJwtToken, ctrl.buyersInterest);

// save properties in wishlist
router.post("/saveProperties/:propertyId", verifyJwtToken, ctrl.saveProperties);
router.get("/saveProperties", verifyJwtToken, ctrl.getbuyerProperties);
router.delete("/saveProperties/:savedId", verifyJwtToken, ctrl.removeSavedProperties);
router.delete("/delete/:propertyId", verifyJwtToken, ctrl.removeSavedPropertyById);
router.post("/notification", verifyJwtToken, ctrl.notificationPreferences);
router.put("/update/notification", verifyJwtToken, ctrl.updatenotificationPreferences);
router.delete("/remove/notification", verifyJwtToken, ctrl.removeNotification);
router.get("/newlyAdded", ctrl.getNewlyAdded);
router.get("/highlyRecommended", ctrl.getHighlyRecommended);
// book a slot
router.post("/bookSlot", [slotBookValidator], verifyJwtToken, ctrl.bookSlot);

// update slot
router.post("/updateSlot", verifyJwtToken, ctrl.updateSlot);

// delete slot
router.post("/deleteSlot", verifyJwtToken, ctrl.deleteSlot);

// plan and expiry management
router.get("/propertyPlan", verifyJwtToken, ctrl.propertyPlan)

// request for visit to the seller
router.post("/request/:propertyId", verifyJwtToken, ctrl.requestSchedule);
router.post("/slots/:propertyId", verifyJwtToken, ctrl.getSlots);
router.get("/accepted", verifyJwtToken, ctrl.getAcceptedProperties);

// enquiry list from buyer side of contacted properties

router.get("/buyersEnquiryList", verifyJwtToken, ctrl.buyersEnquiryList)

module.exports = router;
