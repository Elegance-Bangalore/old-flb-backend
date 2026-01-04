const usersModel = require("../model/users.model");
const propertyModel = require("./../model/property.model");
const savedPropertiesModel = require("./../model/savedProperties");

exports.userPropertyView = async (req, res) => {
  try {
    let page = parseInt(req.query.page);
    let limit = parseInt(req.query.limit);
    let startIndex = (page - 1) * limit;
    let endIndex = page * limit;

    const result = {};

    if (endIndex < (await propertyModel.countDocuments().exec())) {
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

    const order = req.query.order || "";
    const sort = req.query.sort || "";

    let sortOrder = {};
    if (order === "ascending") {
      sortOrder = { [sort]: 1 };
    } else if (order === "descending") {
      sortOrder = { [sort]: -1 };
    } else {
      sortOrder = { createdAt: -1 };
    }

    const query = req.query.query || "";

    let searchQuery = query
      ? {
          $or: [
            {
              propertyCode: { $regex: new RegExp(`^${query}`), $options: "si" },
            },
            {
              propertyType: { $regex: new RegExp(`^${query}`), $options: "si" },
            },
            {
              propertyTitle: {
                $regex: new RegExp(`^${query}`),
                $options: "si",
              },
            },
            {
              otherAmenities: {
                $regex: new RegExp(`^${query}`),
                $options: "si",
              },
            },
            { plotLength: { $regex: new RegExp(`^${query}`), $options: "si" } },
            {
              plotBreadth: { $regex: new RegExp(`^${query}`), $options: "si" },
            },
            {
              possessionStatus: {
                $regex: new RegExp(`^${query}`),
                $options: "si",
              },
            },
            {
              reraApproved: { $regex: new RegExp(`^${query}`), $options: "si" },
            },
            { price: { $regex: new RegExp(`^${query}`), $options: "si" } },
            {
              pricePerSqft: { $regex: new RegExp(`^${query}`), $options: "si" },
            },
            {
              negotiablePrice: {
                $regex: new RegExp(`^${query}`),
                $options: "si",
              },
            },
            {
              boundWallMade: {
                $regex: new RegExp(`^${query}`),
                $options: "si",
              },
            },
            {
              openSidesCount: {
                $regex: new RegExp(`^${query}`),
                $options: "si",
              },
            },
            {
              propertyDescription: {
                $regex: new RegExp(`^${query}`),
                $options: "si",
              },
            },
            { city: { $regex: new RegExp(`^${query}`), $options: "si" } },
            { locality: { $regex: new RegExp(`^${query}`), $options: "si" } },
            { plotShow: { $regex: new RegExp(`^${query}`), $options: "si" } },
            {
              secondaryNum: { $regex: new RegExp(`^${query}`), $options: "si" },
            },
            {
              availability: { $regex: new RegExp(`^${query}`), $options: "si" },
            },
            {
              propertyApproval: {
                $regex: new RegExp(`^${query}`),
                $options: "si",
              },
            },
            {
              propertyStatus: {
                $regex: new RegExp(`^${query}`),
                $options: "si",
              },
            },
          ],
        }
      : {};

    let filter = req.query.propertyApproval || "";
    let filterPropertyApproval = {};
    if (filter) {
      if (filter === "IN_Review") {
        filterPropertyApproval = { propertyApproval: "IN_Review" };
      } else if (filter === "Resolved") {
        filterPropertyApproval = { propertyApproval: "Resolved" };
      } else if (filter === "Reject") {
        filterPropertyApproval = { propertyApproval: "Reject" };
      } else {
        return res
          .status(400)
          .send({ error: "Filter is not per requirements" });
      }
    }

    let propertyTypeFilter = req.query.propertyType || "";
    let propertyTypeQuery = {};

    if (propertyTypeFilter) {
      if (propertyTypeFilter === "agricultureLand") {
        propertyTypeQuery = { propertyType: "agricultureLand" };
      } else if (propertyTypeFilter === "Estates") {
        propertyTypeQuery = { propertyType: "Estates" };
      } else if (propertyTypeFilter === "farmhouse") {
        propertyTypeQuery = { propertyType: "farmhouse" };
      } else if (propertyTypeFilter === "farmland") {
        propertyTypeQuery = { propertyType: "farmland" };
      } else {
        return res
          .status(400)
          .send({ error: "Property type is not per requirements" });
      }
    }

    let amenitiesQuery = {};
    if (req.query.amenities) {
      const amenities = req.query.amenities.split("/");
      amenitiesQuery = { amenities: { $in: amenities } };
    }

    const city = req.query.city || "";

    let cityType = city
      ? {
          city: { $regex: new RegExp(`^${city}`), $options: "si" },
        }
      : {};

    const totalCount = await propertyModel
      .find({ ...cityType })
      .countDocuments()
      .exec();

    let priceFilter = {};
    if (req.query.priceMin && req.query.priceMax) {
      priceFilter = {
        price: { $lte: req.query.priceMax, $gte: req.query.priceMin },
      };
    }

    const pagination =
      page && limit ? [{ $skip: startIndex }, { $limit: parseInt(limit) }] : [];

    let data = await propertyModel
      .aggregate([
        {
          $match: {
            $and: [
              { ...searchQuery },
              { ...filterPropertyApproval },
              { ...propertyTypeQuery },
              { ...amenitiesQuery },
              { ...cityType },
              { ...priceFilter },
            ],
          },
        },
        { $sort: { ...sortOrder } },
        {
          $lookup: {
            from: "sellers",
            localField: "postedBy",
            foreignField: "_id",
            as: "sellerInfo",
          },
        },
        {
          $addFields: {
            postedBy: { $arrayElemAt: ["$sellerInfo", 0] },
          },
        },
        {
          $project: {
            sellerInfo: 0,
            "postedBy.password": 0,
            "postedBy.verificationToken": 0,
          },
        },
        { $facet: { data: [...pagination] } },
      ])
      .exec();

    const queryCount = await propertyModel
      .aggregate([
        {
          $match: {
            $and: [
              { ...searchQuery },
              { ...filterPropertyApproval },
              { ...propertyTypeQuery },
              { ...amenitiesQuery },
              { ...cityType },
              { ...priceFilter },
            ],
          },
        },
        { $count: "count" },
      ])
      .exec();

    // Extract the count value from queryCount array
    const filterCount = queryCount.length > 0 ? queryCount[0].count : 0;

    res.json({
      resStatus: true,
      res: data[0].data,
      count: totalCount,
      filterCount: filterCount,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// exports.shortlistedProperty = async (req, res) => {
//   try {
//     const data = await savedPropertiesModel
//       .find({})
//       .populate({ path: "properties", model: "properties" })
//       .select({__v:0})
//       .lean();

//   } catch (error) {
//     res.status(500).json({ error: "Internal server error" });
//   }
// };

// trending properties
exports.trendingProperty = async (req, res) => {
  try {
    const data = await savedPropertiesModel.aggregate([
      {
        $lookup: {
          from: "properties",
          let: { id: "$properties" },
          pipeline: [
            {
              $match: { $expr: { $eq: ["$_id", "$$id"] } },
            },
          ],
          as: "property",
        },
      },
      { $unwind: "$property" },
      {
        $group: {
          _id: "$properties",
          property: { $first: "$property" },
          count: { $sum: 1 },
        },
      },
    ]);

    let trendingPropertiesData = [];
    data.length
      ? data.map((e) => {
          if (e.count >= 5) {
            trendingPropertiesData.push({
              ...e,
            });
          }
        })
      : [];

    return res.status(200).send({
      status: 200,
      message: "Trending properties list",
      response: trendingPropertiesData,
    });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
};

exports.getMasterPlan = async (req, res) => {
  try {
    const propertyId = req.params.propertyId;
    const data = await propertyModel
      .findOne({ _id: propertyId })
      .select({ masterPlan: 1 })
      .lean();

    if (data) {
      return res
        .status(200)
        .json({ status: 200, message: "Master plan data", response: data });
    } else {
      return res
        .status(400)
        .json({ error: "No master plan associated with the property" });
    }
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
};

exports.shareProperty = async (req, res) => {
  try {
    const platform = req.query.platform;
    const email = req.query.mailto;
    const link = req.body.link;
    if (!platform) {
      return res.status(400).json({ error: "Please provide a valid platform" });
    }
    if (platform === "whatsApp") {
      const text = encodeURIComponent(link);
      res.status(302).send({
        message: "Share on whatsApp",
        response: `https://api.whatsapp.com/send?text=${text}`,
      });
    } else if (platform === "twitter") {
      const text = encodeURIComponent(link);
      res.status(302).send({
        message: "Share on twitter",
        response: `https://twitter.com/intent/tweet?text=${text}`,
      });
    } else if (platform === "email") {
      const recipient = encodeURIComponent(email);
      const subject = encodeURIComponent("Check out this link");
      const body = encodeURIComponent(link);
      res.status(302).send({
        message: "Share on email",
        response: `mailto:${recipient}?subject=${subject}&body=${body}`,
      });
    } else if (platform === "fb") {
      const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
        link
      )}`;
      res.status(302).send({
        message: "Share on facebook",
        response: shareUrl,
      });
    } else {
      return res.status(400).send({ error: "Invalid request" });
    }
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// new added property
exports.getNewPropertyList = async (req, res) => {
  try {
    const data = await propertyModel
      .find({ propertyStatus: "new" })
      .select({
        videos: 0,
        masterPlan: 0,
        maintainanceBills: 0,
        propertyPapers: 0,
        __v: 0,
        layoutMap: 0,
      })
      .lean();
    if (data.length) {
      return res
        .status(200)
        .send({ message: "Newly added property list", response: data });
    } else {
      return res.status(404).send({ error: "No property list found" });
    }
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// getPropertyDetails
exports.getPropertyDetails = async (req, res) => {
  try {
    const propertyId = req.params.propertyId;
    const data = await propertyModel
      .findOne({ _id: propertyId })
      .select({ __v: 0 })
      .lean();
    if (data) {
      return res
        .status(200)
        .json({ message: "Property details", response: data });
    } else {
      return res.status(404).json({ error: "No property found" });
    }
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// userdetails
exports.userDetails = async (req, res) => {
  try {
    const {_id} = req.user;
    const userData = await usersModel
    .findOne({ _id })
    .select({
      __v: 0,
      password: 0,
    })
    .lean();
  if (!userData) {
    return res.status(404).send({ status: 404, message: "User not found" });
  }

  return res
    .status(200)
    .send({ status: 200, message: "User details", response: userData });
  } catch (error) {
    return res.status(500).json({ error: error.message });
    
  }
}
