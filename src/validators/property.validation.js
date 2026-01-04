const { body,query } = require("express-validator");


exports.propertyCodeValidator = [query("propertyCode").notEmpty()];

exports.postPropertyValidator =  [
    body("propertyType", "Property type cannot be empty").not().isEmpty(),
    body("plotArea", "Select any one plot area from the dropdown").not().isEmpty(),
    body("possessionStatus", "Possession Status is required").not().isEmpty(),
    body("reraApproved", "RERA approved cannot be empty").not().isEmpty(),
    body("boundWallMade", "Boundary wall field cannot be empty").not().isEmpty(),
    body("openSidesCount", "Open sides field cannot be empty").not().isEmpty(),
    body("city", "city field cannot be empty").not().isEmpty(),
    body("possessionDate", "Possession Date field cannot be empty").not().isEmpty(),
    body("price", "Price field cannot be empty").not().isEmpty(),
    body("negotiablePrice", "Negotiable price field cannot be empty").not().isEmpty(),
    body("propertyDescription", "Property Description field cannot be empty").not().isEmpty(),
    body("locality", "Locality field cannot be empty").not().isEmpty(),
    body("map", "Map field cannot be empty").not().isEmpty(),
    body("amenities", "Amenities field cannot be empty").not().isEmpty(),
    body("layoutMap", "Layout map is required").not().isEmpty(),
    body("images", "Image is required").not().isEmpty(),
    // body("videos", "Video is required").not().isEmpty(),
    // body("plotShow", "Plot show field cannot be empty").not().isEmpty(),
    // body("secondaryNum", "Secondary number field cannot be empty").not().isEmpty(),
    // body("availability", "Availability field cannot be empty").not().isEmpty(),
    // body("scheduledTime", "Scheduled time field cannot be empty").not().isEmpty(),
    body("heroImage", "Hero image field cannot be empty").not().isEmpty(),
  ];
