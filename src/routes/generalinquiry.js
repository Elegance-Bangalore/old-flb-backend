const router = require("express").Router();

const ctrl = require("../controller/generalinquiry")
const { verifyJwtToken } = require("../utils/token.utils");

router.post("/create", ctrl.generalInquiry);
router.get("/get", verifyJwtToken, ctrl.getGeneralInquiries);
router.post("/reply/:inquiryId", verifyJwtToken, ctrl.reply);
router.delete("/delete/:inquiryId", verifyJwtToken, ctrl.deleteInquiry);


module.exports = router;
