const router = require("express").Router();
const { verifyJwtToken } = require("../utils/token.utils");
const ctrl = require("./../controller/message.controller");

router.get("/get/:id/:propertyId", verifyJwtToken, ctrl.getMessages);
router.post("/send/:id/:propertyId", verifyJwtToken, ctrl.sendMessage);
router.get("/chats", verifyJwtToken, ctrl.chats);

router.get("/markRead/:propertyId/:senderId", verifyJwtToken, ctrl.markRead);



module.exports = router;
