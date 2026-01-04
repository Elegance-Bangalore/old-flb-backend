const usersModel = require("../model/users.model");
const sellerModel = require("./../model/seller.model");
const { validationResult } = require("express-validator");
module.exports = async (req, res, next) => {
  try {
    let { email } = req.body;
    const lowerCaseEmail = email.toLowerCase();
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.send({ status: 422, errors: errors.array() });
    }

    // check if the seller exists in DB or not
    let data = await sellerModel.findOne({ email : lowerCaseEmail }).lean();
    let userData = await usersModel.findOne({email : lowerCaseEmail}).lean();
    

    if(!userData) {
      if (!data) {
        return res.send({
          status: 403,
          message: "No account is associated with this email !",
        });
      } else if (data && !data.isAccountVerified) {
        // check in case of unverified account
        return res.send({
          status: 403,
          message: "Account associated with the email is not verified !",
        });
      } else {
        req.user = { ...data };
        next();
      }
    }else {
      req.user = { ...userData };
      console.log("User", req.user);
        next();
    }

    
  } catch (e) {
    console.log(e);
    return res.status(500).send({ status: 500, message: e.message });
  }
};
