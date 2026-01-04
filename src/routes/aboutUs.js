const router = require("express").Router();
const { verifyJwtToken } = require("../utils/token.utils");

const ctrl = require("../controller/aboutUs");

router.post("/create", verifyJwtToken, ctrl.addAboutUs);
router.put("/edit/:aboutId", verifyJwtToken, ctrl.editAboutUs);
router.get("/get", ctrl.getAboutUs);


module.exports = router;
