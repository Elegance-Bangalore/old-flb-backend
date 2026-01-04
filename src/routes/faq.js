const router = require("express").Router();
const { verifyJwtToken } = require("../utils/token.utils");

const { createFaqs, getFaqsLists, updateFaqs, deleteFaqs } = require("../controller/faqs");

router.post("/create", verifyJwtToken, createFaqs);
router.get("/get", verifyJwtToken, getFaqsLists);
router.put("/update/:faqId", verifyJwtToken, updateFaqs);
router.delete("/delete/:faqId", verifyJwtToken, deleteFaqs);

module.exports = router;
