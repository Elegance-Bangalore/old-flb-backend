const sellerModel = require("./../model/seller.model");
module.exports = async (req, res, next) => {
  try {
    let { email, phone } = req.body;

    // check if email and phone already exists
    let data = await sellerModel
      .findOne({ $or: [{ email: email }, { phone: phone }] })
      .select({ _id: 1 })
      .lean();

    if (data) {
      return res.send({ status: 403, message: "Account already exists" });
    } else {
      next();
    }
  } catch (e) {
    console.log(e);
    return res.send({ status: 500, message: e.message });
  }
};
