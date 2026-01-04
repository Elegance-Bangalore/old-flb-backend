const express = require("express");
const router = express.Router();

const { verifyJwtToken } = require("../utils/token.utils");
const ctrl = require("../controller/propertyAnalytics");

router.get("/propertiesAnalytics", ctrl.getPropertyAnalytics);




module.exports = router