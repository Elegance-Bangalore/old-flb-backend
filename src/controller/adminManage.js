const Seller = require("../model/seller.model");
const Property = require("../model/property.model");
const Subscription = require("../model/sellerSub.model");

exports.getAllBuyers = async (req, res) => {
  try {
    const page = parseInt(req.query.page);
    const limit = parseInt(req.query.limit);
    let startIndex = (page - 1) * limit;
    let endIndex = page * limit;

    let result = {};

    const query = req.query.query || "";

    let searchQuery = query
      ? {
          $or: [
            { fullName: { $regex: new RegExp(query), $options: "si" } },
            { email: { $regex: new RegExp(query), $options: "si" } },
            { phone: { $regex: new RegExp(query, "si") } },
          ],
        }
      : {};

    const totalCount = await Seller.countDocuments({
      interested: "buy",
      ...searchQuery,
    }).exec();

    if (endIndex < totalCount) {
      result.next = {
        page: page + 1,
        limit: limit,
      };
    }

    if (startIndex > 0) {
      result.previous = {
        page: page - 1,
        limit: limit,
      };
    }

    const buyers = await Seller.find({ interested: "buy", ...searchQuery })
      .skip(startIndex)
      .limit(limit);
    return res.status(200).send({
      message: "Successfully fetched",
      buyers: buyers,
      count: totalCount,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ error: "Something broke!" });
  }
};

exports.getRecentlyAddedProperties = async (req, res) => {
  try {
    const properties = await Property.find({
      propertyApproval: { $ne: "IN_Review" },
      status: { $ne: "draft" },
    })
      .populate({
        path: "postedBy",
        model: "sellers",
        select: "fullName email phone",
      })
      .sort({ createdAt: -1 })
      .limit(10);
    return res
      .status(200)
      .send({ properties: properties, message: "Successfully fetched" });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ error: "Something broke!" });
  }
};

exports.adminManageSubscription = async (req, res) => {
  try {
    const { sellerId } = req.params;
    const seller = await Seller.findById(sellerId);
    if (!seller) return res.status(400).send({ error: "seller not found" });
    const { expiresAt, plan, price, subscription } = req.body;
    const subscriptions = new Subscription({
      id: sellerId,
      expiresAt,
      plan,
      price,
      isActive: subscription,
      email: seller.email,
    });
    await subscriptions.save();

    const sellerSub = await Seller.findOneAndUpdate(
      { _id: sellerId },
      { $set: { subscription: subscription } },
      { new: true }
    );

    return res
      .status(200)
      .send({
        subscription: subscriptions,
        sellerSub,
        message: "Successfully Subscribed",
      });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ error: "Something broke" });
  }
};
