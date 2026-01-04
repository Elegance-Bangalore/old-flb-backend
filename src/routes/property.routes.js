const router = require("express").Router();
const ctrl = require("./../controller/property.controller");
const { verifyJwtToken, verifyOptionalJwtToken } = require("./../utils/token.utils");
const {
  propertyCodeValidator,
  postPropertyValidator,
} = require("../validators/property.validation");
//const upload = require("./../utils/multer.utils");
const multer = require('multer');
const upload = multer();

const {sysLog} = require("../middleware/sysLogs")

// const multer = require("multer");
// const path = require("path");

// pending part to be integrated with AWS credentials
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, "uploads/");
//   },
//   filename: (req, file, cb) => {
//     const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
//     cb(null, `${file.originalname}-${uniqueSuffix}`);
//   },
// });

// const upload = multer({ storage: storage });

router.post(
  "/postProperty",
  //[postPropertyValidator],
  verifyJwtToken,
  upload.fields([
    { name: "layoutMap" },
    { name: "images" },
    { name: "videos" },
    { name: "masterPlan" },
    { name: "logo" },
    {name : "maintainanceBills"},
    {name : "propertyPapers"}
  ]),
  ctrl.postProperty
);
router.post(
  "/editProperty",
  [propertyCodeValidator],
  verifyJwtToken,
  upload.fields([
    { name: "layoutMap" },
    { name: "images" },
    { name: "videos" },
    { name: "masterPlan" },
    { name: "logo" },
    {name : "maintainanceBills"},
    {name : "propertyPapers"}
  ]),
  ctrl.editProperty
);

router.get(
  "/propertyDetails",
  [propertyCodeValidator],
  verifyOptionalJwtToken,
  ctrl.propertyDetails
);

router.get("/nearplaces", ctrl.nearbyplace);

// router.get(
//   "/propertyDetails",
//   (req, res, next) => {
//     if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
//       verifyJwtToken(req, res, next);
//     } else {
//       next();
//     }
//   },
//   ctrl.propertyDetails
// );
router.patch(
  "/statusManagement",
  [propertyCodeValidator],
  verifyJwtToken,
  ctrl.statusManagement
);

// property listing api

router.get("/propertyList", verifyJwtToken, ctrl.propertyList);
router.post("/upload-files/", upload.array('maintainanceBills'), ctrl.uploadMaintainanceBills);
router.post("/upload-papers/", upload.array('propertyPapers'), ctrl.uploadPropertyPapaers);

// download brocher
router.get("/download/:propertyId", ctrl.downloadBrochure)
module.exports = router;
