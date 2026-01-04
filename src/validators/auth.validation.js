const { body, query } = require("express-validator");

exports.signupValidator = [
  body("email", "email field cannot be empty").isEmail(),
  body("phone", "phone field cannot be empty").not().isEmpty(),
  body("fullName", "full name is required").not().isEmpty(),
  body("password", "The minimum password length is 6 characters")
    .not()
    .isEmpty()
    .isLength(),
  body("interested", "select any one option, buy or sell").not().isEmpty(),
];
exports.getOtpValidator = [
  body("phone", "phone field cannot be empty").not().isEmpty(),
];
exports.verifyOtpValidator = [
  body("phone", "phone field cannot be empty").not().isEmpty(),
  body("otp", "otp field cannot be empty").not().isEmpty(),
];
exports.loginValidator = [
  body("email", "email field cannot be empty").isEmail(),
];
exports.planValidator = [
  body("plan", "plan field cannot be empty").not().isEmpty(),
];

exports.editProfileValidation = [query("token").notEmpty()];

