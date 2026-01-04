const router = require("express").Router();
const { verifyJwtToken } = require("../utils/token.utils");

const {createFooter, getFooterLists, updateFooter, deleteFooter, updateStatus} = require("../controller/manageFooter")

router.post("/create",verifyJwtToken, createFooter)
router.get("/get",verifyJwtToken, getFooterLists)
router.put("/update/:footerId",verifyJwtToken, updateFooter)
router.delete("/delete/:footerId",verifyJwtToken, deleteFooter)
router.patch("/status/:footerId",verifyJwtToken, updateStatus)


module.exports = router