const router = require("express").Router();
const { verifyJwtToken } = require("../utils/token.utils");
const ctrl = require("./../controller/admin.controller");
const {
  propertyCodeValidator,
  postPropertyValidator,
} = require("./../validators/property.validation");
const { signupValidator } = require("./../validators/auth.validation");
const
{ deleteDeveloperValidator }
=
require("./../validators/buyer.validation")
const multer = require("multer");
const upload = multer();
const {
  checkIfSellerExists,
  checkIfUserExists,
} = require("./../middleware");

// review of property listin
router.get("/property_list", verifyJwtToken, ctrl.property_list);
router.put(
  "/edit",
  // [propertyCodeValidator],
  verifyJwtToken,
  upload.fields([
    { name: "layoutMap" },
    { name: "images" },
    { name: "videos" },
    { name: "masterPlan" },
    { name: "propertyAds" },
    { name: "logo" },
    { name: "maintainanceBills" },
    { name: "propertyPapers" },
  ]),
  ctrl.adiminEditProperty
);

// update the proerty status as sold or available
router.put(
  "/updatePropertyStatus/:propertyId",
  verifyJwtToken,
  ctrl.updatePropertyStatus
);

router.patch(
  "/archiveProperty/:propertyId",
  verifyJwtToken,
  ctrl.archiveProperties
);
router.patch(
  "/updateApproval/:propertyId",
  verifyJwtToken,
  ctrl.updatePropertyApproval
);

// delete a property by admin
router.delete(
  "/deleteProperty/:propertyId",
  verifyJwtToken,
  ctrl.deleteProperty
);

// add property by admin on behalf of a seller
router.post(
  "/postProperty/:sellerId",
  // [postPropertyValidator],
  verifyJwtToken,
  upload.fields([
    { name: "layoutMap" },
    { name: "images" },
    { name: "videos" },
    { name: "masterPlan" },
    { name: "propertyAds" },
    { name: "logo" },
    { name: "maintainanceBills" },
    { name: "propertyPapers" },
  ]),
  ctrl.postProperty
);

// all the enquiry listing for admin role
router.get("/enquiryList", verifyJwtToken, ctrl.enquiryList);

// delete an enquiry from listing for admin role
router.get("/deleteEnquiry/:_id", verifyJwtToken, ctrl.deleteEnquiry);

router.post(
  "/storedeveloper",
  verifyJwtToken,
  [signupValidator],
  checkIfSellerExists,
  ctrl.storeDeveloper
);
router.get("/getdeveloperslist", verifyJwtToken, ctrl.getDevelopersList);
router.put(
  "/updatedeveloperprofile",
  verifyJwtToken,
  ctrl.updateDeveloperProfile
);

// admin to access user management system
router.get("/userManagement", verifyJwtToken, ctrl.userManagement);

// user management
router.post("/userCreate", verifyJwtToken, checkIfUserExists, ctrl.userCreate);

// edit a user
router.put("/editUser/:userId", verifyJwtToken, ctrl.editUser);

// user activation /deactivation
router.get("/toggleUserStatus/:userId", verifyJwtToken, ctrl.toggleUserStatus);

// view user details
router.get("/userDetails/:userId", verifyJwtToken, ctrl.userDetails);

// delete a user along with its associated data
router.delete("/deleteUser/:userId", verifyJwtToken, ctrl.deleteUser);

// assigning user roles
router.patch("/assignUserRoles/:userId", verifyJwtToken, ctrl.assignUserRoles);

// manager categories
router.post(
  "/createPropertyCategory",
  verifyJwtToken,
  ctrl.createPropertyCategory
);

// property categories list posting or edit property
router.get(
  "/getPropertyCategoryList",
  ctrl.getPropertyCategoryList
);

// property category list with its visibility & property count associated with it
router.get("/categoryList", verifyJwtToken, ctrl.categoryList);

// property data associated with the category list
router.get("/propertyList/:categoryId", verifyJwtToken, ctrl.propertyListByCategoryId);

// delete a category list by admin
router.delete(
  "/deleteCategory/:categoryId",
  verifyJwtToken,
  ctrl.deleteCategory
);

// change visiblity of a  category
router.get(
  "/categoryVisibility/:categoryId",
  verifyJwtToken,
  ctrl.categoryVisibility
);

// edit property category
router.put(
  "/editPropertyCategory/:categoryId",
  verifyJwtToken,
  ctrl.editPropertyCategory
);

// property move to a different category
router.put(
  "/propertyCategoryUpdate",
  verifyJwtToken,
  ctrl.propertyCategoryUpdate
);

router.get("/getadmindashboard", verifyJwtToken, ctrl.getAdminDashboard);

// minified list of sellers, property creation by admin
router.get("/sellerMinifiedList", verifyJwtToken, ctrl.sellerMinifiedList);


router.post("/deletedeveloperprofile", verifyJwtToken, [deleteDeveloperValidator], ctrl.deleteDeveloperProfile);
 
router.patch("/recoverdeveloperprofile/:developerId", verifyJwtToken, ctrl.recoverDeveloperProfile);


router.put("/allUpdate", ctrl.updateAllPropertiesStatus); 
router.put("/zero", ctrl.updateAllPropertiesPrice); 
router.get("/decimal", ctrl.getPropertiesWithDecimalPrice); 

router.post('/coupons/create', ctrl.createCoupon);
router.get('/coupons', ctrl.getCoupons);
router.put('/coupons/:id', ctrl.updateCoupon);
router.delete('/coupons/:id', ctrl.deleteCoupon);
router.post('/coupons/validate', ctrl.validateCoupon);

module.exports = router;
