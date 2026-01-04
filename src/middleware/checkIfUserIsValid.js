
const { validationResult } = require("express-validator");
const usersModel = require("../model/users.model");
module.exports = async (req, res, next) => {
  try {
    let { email } = req.body;
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.send({ status: 422, errors: errors.array() });
    }

    // check if the seller exists in DB or not
    let data = await usersModel.findOne({ email }).lean();

    if (!data) {
      return res.send({
        status: 403,
        message: "No account is associated with this email !",
      });
    }  else {
      req.user = { ...data };
      next();
    }
  } catch (e) {
    console.log(e);
    return res.status(500).send({ status: 500, message: e.message });
  }
};
