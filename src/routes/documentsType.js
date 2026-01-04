const express = require("express");
const router = express.Router();

const ctrl = require("../controller/documentsType");
const {verifyJwtToken, verifyOptionalJwtToken} = require("../utils/token.utils");

router.post("/createDocumentsType", verifyJwtToken, ctrl.createDocumentsType)
router.put("/updateDocumentsType/:id", verifyJwtToken, ctrl.updateDocumentsType)
router.get("/getDocumentsType", verifyJwtToken, ctrl.getDocumentsType)
router.delete("/deleteDocumentsType/:id", verifyJwtToken, ctrl.deleteDocumentsType)


//create plans
router.post("/createPlans", ctrl.createAllPlans)

module.exports = router