const express = require("express");
const router = express.Router()

const ctrl = require("../controller/existingProperties");
const { verifyJwtToken } = require("../utils/token.utils");

router.post('/update-properties-from-csv', ctrl.updatePropertiesFromCSV);
router.get('/recently-added-properties', ctrl.getRecentlyAddedProperties);

//sending buyer properties notifications
// router.post('/mailProperties', ctrl.sendBuyerProperties);

router.get("/citiesTrends", ctrl.citiesPropertiesTrends)
router.get("/statesTrends", ctrl.statesPropertiesTrends)


module.exports = router