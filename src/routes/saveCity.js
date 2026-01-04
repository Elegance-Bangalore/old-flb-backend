const express = require("express")
const router = express.Router()

const ctrl = require("../controller/saveCity")
const { verifyJwtToken } = require("../utils/token.utils");

router.post("/saveCity", ctrl.saveCitiesData);
router.post("/saveSpecificCity", ctrl.saveSpecifiCity);


module.exports = router