const express = require("express");
const router = express.Router()

const ctrl = require("../controller/contactUs");
const { verifyJwtToken } = require("../utils/token.utils");

router.post("/create", verifyJwtToken, ctrl.addContactUs);
router.put("/edit/:contactId", verifyJwtToken, ctrl.editContactUs);
router.get("/get", ctrl.getContactUs);
router.get("/getContact/:contactId", ctrl.getContactUsById);


module.exports = router