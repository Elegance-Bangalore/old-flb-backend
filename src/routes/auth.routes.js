const router = require("express").Router();
const { verifyJwtToken } = require("../utils/token.utils");
const {
  signupValidator,
  getOtpValidator,
  verifyOtpValidator,
  loginValidator,
} = require("../validators/auth.validation");
const ctrl = require("./../controller/auth.controller");
const {
  checkIfSellerExists,
  checkIfSellerIsValid,
  checkIfUserIsValid
} = require("./../middleware");

const {sysLog} = require("../middleware/sysLogs")

// seller sign up
router.post(
  "/signup",
  [signupValidator],
  checkIfSellerExists,
  ctrl.signupSeller
);
router.post(
  "/verifyEmail",
  ctrl.verifyEmailToken
);
router.post(
  "/resend",
  verifyJwtToken,
  ctrl.resendMail
);
router.post(
  "/verifyToken",
  verifyJwtToken,
  ctrl.verifyTokenExpiry
);

// seller login
router.post("/otp", [getOtpValidator], ctrl.sendOtp);

// user login
// router.post("/userOTP", [getOtpValidator], ctrl.userOTP);

// verify login
router.post("/verifyOTP", [verifyOtpValidator], ctrl.verifyPhoneOtp);

// // verify otp for user
// router.post("/verifyUserOTP", [verifyOtpValidator], ctrl.verifyUserOTP);

// login
router.post("/login", [loginValidator], checkIfSellerIsValid, ctrl.login);
// router.post("/userlogin", [loginValidator], checkIfUserIsValid, ctrl.userlogin);

// forgot password
router.post(
  "/forgotPassword",
  [loginValidator],
  checkIfSellerIsValid,
  ctrl.forgotPassword
);

// reset password
router.post("/resetPassword", ctrl.resetPassword);
router.post("/changePassword", verifyJwtToken, ctrl.changePassword);
router.put("/changePhone", verifyJwtToken, ctrl.changePhone);
router.put("/changeEmail", verifyJwtToken, ctrl.changeEmail);

// check if reset password is expired or not
router.get("/linkValidity", ctrl.linkValidity);

// email verify
router.get("/verifyEmail", ctrl.verifyEmail);

// change password for buyer and seller
router.put("/password", verifyJwtToken, ctrl.changePasswordBoth);

//backend functionality for update data according to data migration
router.put("/verifyAccount", ctrl.verifyAccount);
router.put("/verifyinterested", ctrl.verifyinterested);
router.put("/layoutMap", ctrl.updateLayoutMap);

module.exports = router;
