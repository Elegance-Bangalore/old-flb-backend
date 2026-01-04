const express = require("express");
const router = express.Router();

const ctrl = require("../controller/terms&Cond");
const { verifyJwtToken } = require("../utils/token.utils");

router.post("/addTerms", verifyJwtToken, ctrl.addTermsCondition);
router.put("/updateTerms/:termsId", verifyJwtToken, ctrl.updateTermsCondition);
router.get("/getTerms", ctrl.getTermsCondition);


module.exports = router