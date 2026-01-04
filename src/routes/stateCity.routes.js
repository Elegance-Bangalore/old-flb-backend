const router = require("express").Router();

const { verifyJwtToken } = require("../utils/token.utils");

const stateCity = require("../controller/stateCity.controller")

router.get("/getCountryList", verifyJwtToken, stateCity.getCountryList);
router.get("/getStateList/:country_id", verifyJwtToken, stateCity.getStateList);
router.get("/getCityList/:state_id", verifyJwtToken, stateCity.getCityList);


module.exports = router;
