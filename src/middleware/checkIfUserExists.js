const sellerModel = require("../model/seller.model");
const userModel = require("./../model/users.model");
module.exports = async (req, res, next) => {
  try {
    let { userId } = req.params;
    let { email, phone } = req.body;

    // check if email already exist
    let data = await userModel
      .findOne({ $or: [{ email: email }, { phone: phone }] })
      .select({ _id: 1, email: 1 })
      .lean();
    let dataFromSell_buy = await sellerModel
      .findOne({ $or: [{ email: email }, { phone: phone }] })
      .select({ _id: 1, email: 1 })
      .lean();
    if (data || dataFromSell_buy) {
      return res
        .status(403)
        .send({ status: 403, message: "Account already exists" });
    } else {
      next();
    }
  } catch (e) {
    console.log(e);
    return res.send({ status: 500, message: e.message });
  }
};
