const express = require("express");
const router = express.Router();
const { verifyJwtToken } = require("../utils/token.utils");

const ctrl = require("../controller/testimonials");


router.post("/createTestimonial", verifyJwtToken, ctrl.addTestimonial);
router.put("/editTestimonial/:testimonialId", verifyJwtToken, ctrl.updateTestimonial);
router.get("/getTestimonial", ctrl.getAllTestimonials);
router.get("/getTestimonialById/:testimonialId", ctrl.getTestimonial);
router.delete("/deleteTestimonial/:testimonialId", verifyJwtToken, ctrl.deleteTestimonial);

//media links
router.post("/addMedia", verifyJwtToken, ctrl.addMediaLink);
router.put("/editMedia/:mediaId", verifyJwtToken, ctrl.updateMediaLink);
router.get("/getMediaDetail/:mediaId", verifyJwtToken, ctrl.getMediaLink);
router.delete("/deleteMedia/:mediaId", verifyJwtToken, ctrl.deleteMediaLink);
router.get("/getallMedia", verifyJwtToken, ctrl.getAllMediaLink);
module.exports = router