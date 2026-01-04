const express = require("express");
const router = express.Router();

const ctrl = require("../controller/advertise");
const { verifyJwtToken } = require("../utils/token.utils");

router.post("/requestAdvertise", ctrl.requestAdverisement)
router.get("/getAdvertise", verifyJwtToken, ctrl.getAdvertise)

module.exports = router