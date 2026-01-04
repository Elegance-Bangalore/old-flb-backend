const { body, query } = require("express-validator");

//porpertyCode, sellerId, scheduledTime
exports.slotBookValidator = [
  body("propertyCode", "Property code field cannot be empty").not().isEmpty(),
  body("sellerId", "Seller Id field cannot be empty").not().isEmpty(),
  body("scheduledTime", "Scheduled date/time field cannot be empty").not().isEmpty(),
];


exports.deleteDeveloperValidator = [
  body('userId').exists().withMessage('User ID is required'),
  body('deleteOption').exists().withMessage('Delete option is required').isIn(['softDelete', 'completeDelete']).withMessage('Invalid delete option'),
];  