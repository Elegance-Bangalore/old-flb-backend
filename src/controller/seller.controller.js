const enquiryModel = require("../model/enquiry.model");
const sellerModel = require("../model/seller.model");
const moment = require("moment");
const cloudinary = require("./../utils/cloudinary.utils");
const activityTrackerModel = require("../model/activityTracker.model");
const Property = require("../model/property.model");
const subscriptionData = require("./../config/subscription");
const sellerSubModel = require("../model/sellerSub.model");
const { validationResult } = require("express-validator");
const mongoose = require("mongoose");
const { uploadImage, uploadVideo } = require("../utils/conrollerUtils");
const bookingSlotModel = require("../model/bookingSlot.model");
const Requests = require("../model/savedProperties");
const Saved = require("../model/buyerSaved");
const Blogs = require("../model/blogs");
const sendEmailSign = require("../utils/emailSend.js");
const OtherAmenity = require("./../model/otherAmenities.model.js");
const { ObjectId } = require("mongoose").Types;
const axios = require("axios");
const geolib = require("geolib");

const Category = require("../model/category");
const propertyCategoryModel = require("../model/propertyCategory.model.js");


const modelName = "cities";
let City;
if (mongoose.models[modelName]) {
  City = mongoose.models[modelName];
} else {
  const citySchema = new mongoose.Schema(
    {},
    { strict: false, timestamps: true }
  );
  City = mongoose.model(modelName, citySchema);
}

// exports.profile = async (req, res) => {
//   try {
//     const { _id } = req.user;

//     let features = [],
//       obj = {};

//     let data = await sellerModel
//       .find({ _id })
//       // .select({ password: 0, __v: 0 })
//       // .lean();

//     if (data && data.length) {
//       let planName = await sellerSubModel
//         .findOne({ id: _id.toString(), isActive: true })
//         .select({ plan: 1, _id: 0 })
//         .lean();

//       if (planName) {
//         features = subscriptionData.subscription.filter((sub) => {
//           return sub.planName === planName.plan;
//         });
//       }
//       features.length
//         ? features.map((e) => {
//             for (let i = 0; i < e.features.length; i++) {
//               let name = e.features[i].name.toLowerCase().replace(/\s+/g, "_");

//               obj = {
//                 ...obj,
//                 [`${name}`]: e.features[i].isIncluded,
//               };
//             }
//           })
//         : [];

//       return res.send({
//         status: 200,
//         message: "Seller profile",
//         data: { data: data, features: obj },
//       });
//     }
//   } catch (err) {
//     return res.status(500).send({ status: 500, message: err.message });
//   }
// };

exports.profile = async (req, res) => {
  try {
    const { _id } = req.user;

    let features = {},
      obj = {};

    let data = await sellerModel.findOne({ _id });
    // .select({ password: 0, __v: 0 })
    // .lean();

    if (data) {
      let planName = await sellerSubModel
        .findOne({ id: _id.toString(), isActive: true })
        .select({ plan: 1, _id: 0 })
        .lean();

      if (planName) {
        features = subscriptionData.subscription.find((sub) => {
          return sub.planName === planName.plan;
        });
      }

      if (features && features.features) {
        // Check if features.features is defined
        for (let i = 0; i < features.features.length; i++) {
          let name = features.features[i].name
            .toLowerCase()
            .replace(/\s+/g, "_");

          obj = {
            ...obj,
            [`${name}`]: features.features[i].isIncluded,
          };
        }
      }

      return res.send({
        status: 200,
        message: "Seller profile",
        data: { ...data.toObject(), features: obj },
      });
    } else {
      return res.status(404).send({ status: 404, message: "Seller not found" });
    }
  } catch (err) {
    console.log(err);
    return res.status(500).send({ status: 500, message: err.message });
  }
};

exports.developerProfile = async (req, res) => {
  try {
    const { logo, companyName, ...rest } = req.body;
    const payload = rest;
    const { _id } = req.user;
    let reg = new RegExp("^(http|https)://", "i");
    let result;

    console.log(logo, "..............................................");

    if (logo) {
      if (!reg.test(logo)) {
        const logoResult = await uploadImage(logo);
        result = logoResult.Location;
      } else {
        result = logo; // already a URL
      }
    } else {
      result = null; // or 'none' if you prefer
    }

    if (payload.alternateNumber) {
      const alternateNumberExists = await sellerModel.findOne({
        $and: [
          {
            $or: [
              { alternateNumber: payload.alternateNumber },
              { phone: payload.alternateNumber },
            ],
          },
          { _id: { $ne: _id } },
        ],
      });
      if (alternateNumberExists) {
        return res.status(400).send({
          status: 400,
          message: "Alternate number already exists for another user",
        });
      }
    }

    if (companyName) {
      const existingCompany = await sellerModel.findOne({
        companyName: { $regex: new RegExp(`^${companyName}$`, "i") },
        _id: { $ne: _id },
      });
      if (existingCompany) {
        return res.status(400).send({
          status: 400,
          message: "Company name already exists for another user",
        });
      }
    }

    let dataToUpdate = { ...payload, companyName };
    dataToUpdate.logo = result;

    const data = await sellerModel.findOneAndUpdate(
      { _id },
      { $set: { ...dataToUpdate, profileCompleted: true } },
      { new: true }
    );

    if (data) {
      return res.send({
        status: 200,
        message: "Developer details updated",
        data: data,
      });
    }
  } catch (err) {
    return res.status(500).send({ status: 500, message: err.message });
  }
};

exports.editProfile = async (req, res) => {
  try {
    const { _id } = req.user;
    const { profilePic, ...rest } = req.body;
    // const payload = req.body;
    const payload = rest;
    let result;
    let reg = new RegExp("^(http|https)://", "i");

    if (profilePic) {
      if (!reg.test(profilePic)) {
        const profileResult = await uploadImage(profilePic);
        result = profileResult.Location;
      }
    }

    if (payload.alternateNumber) {
      // Check if the alternate number exists for another user
      const alternateNumberExists = await sellerModel.findOne({
        $and: [
          {
            $or: [
              { alternateNumber: payload.alternateNumber },
              { phone: payload.alternateNumber },
            ],
          },
          { _id: { $ne: _id } }, // Exclude the current user
        ],
      });
      if (alternateNumberExists) {
        return res.status(400).send({
          status: 400,
          message: "Alternate number already exists for another user",
        });
      }
    }
    let dataToUpdate = { ...payload };

    if (result) {
      dataToUpdate = {
        ...dataToUpdate,
        profilePic: result,
      };
    }

    const data = await sellerModel.findOneAndUpdate(
      { _id },
      {
        $set: {
          ...dataToUpdate,
          profileCompleted: true,
        },
      },
      { new: true }
    );

    if (data) {
      delete data.password;
      return res.send({
        status: 200,
        message: "Profile updated successfully",
        data: data,
      });
    }
  } catch (err) {
    console.log(err);
    return res.status(500).send({ status: 500, message: err.message });
  }
};

// compare function
exports.compareObjects = async (data, payload) => {
  const changes = {};
  for (let key in payload) {
    if (payload.hasOwnProperty(key)) {
      if (payload.hasOwnProperty(key) && data[key] !== payload[key]) {
        changes[key] = payload[key];
      }
    }
  }

  return changes;
};

// enquiry list
exports.inquiryList = async (req, res) => {
  try {
    let { _id, email } = req.user;

    let page = !req.query.page ? 1 : parseInt(req.query.page),
      limit = !req.query.limit ? 10 : parseInt(req.query.limit);
    let skip = (page - 1) * limit;
    let sortBy = req.query.sort || "propertyTitle";
    let order = req.query.order || "desc";
    let filter = req.query.filter || "all";
    let searchKey = req.query.search || "";
    let startDate = new Date(),
      endDate = new Date();
    let sortArray = {};

    // sorting
    if (sortBy !== undefined && sortBy != "") {
      sortArray[sortBy] = order == "asc" ? 1 : -1;
    } else {
      sortArray["propertyTitle"] = order === "asc" ? 1 : -1;
    }

    let query = {};

    let currentYear = moment().year();
    let currentMonth = moment().month();
    if (filter == "weekly") {
      startDate = moment(startDate).subtract(7, "days").toDate();
      endDate = moment(endDate).toDate();
    }
    if (filter == "monthly") {
      startDate = moment({
        currentYear,
        month: currentMonth,
        day: 1,
      }).format("YYYY-MM-DD");
      endDate = moment({
        currentYear,
        month: currentMonth,
        day: moment({ currentYear, month: currentMonth }).daysInMonth(),
      }).format("YYYY-MM-DD");
    }
    let quater = 1;
    let currentMonthValue = currentMonth + 1;
    if (currentMonthValue <= 3) {
      quater = 1;
    } else if (currentMonthValue >= 4 && currentMonthValue <= 6) {
      quater = 2;
    } else if (currentMonthValue >= 7 && currentMonthValue <= 9) {
      quater = 3;
    } else if (currentMonthValue >= 10 && currentMonthValue <= 12) {
      quater = 4;
    }
    if (filter == "quaterly") {
      startMonth = (quater - 1) * 3 + 1;
      endMonth = quater * 3;
      startDate = moment()
        .year(currentYear)
        .month(startMonth - 1)
        .startOf("month")
        .toDate();
      endDate = moment()
        .year(currentYear)
        .month(endMonth - 1)
        .endOf("month")
        .toDate();
    }

    // adding search query
    if (
      searchKey &&
      searchKey !== undefined &&
      searchKey !== "" &&
      searchKey !== " "
    ) {
      (skip = 0),
        (query = {
          ...query,
          $or: [
            { propertyTitle: { $regex: searchKey.trim(), $options: "si" } },
          ],
        });
    }

    if (filter !== "all") {
      query = {
        ...query,
        createdAt: { $gte: startDate, $lte: endDate },
      };
    }

    let propertyList = await Property.find({
      postedBy: _id,
    })
      .select({
        propertyCode: 1,
        price: 1,
        plotArea: 1,
        plotLength: 1,
        plotBreadth: 1,
        totalAcre: 1,
      })
      .lean();

    let propList = propertyList.length
      ? propertyList.map((e) => {
          return e._id;
        })
      : [];
    query = {
      ...query,
      propertyId: { $in: propList },
    };

    let totalRecords = await enquiryModel.countDocuments({ ...query }).exec();
    let inquiryData = await enquiryModel
      .find({ ...query })
      .sort({ ...sortArray })
      .skip(skip)
      .limit(limit)
      .populate("propertyId")
      .lean();

    let newData = [];
    inquiryData.length
      ? inquiryData.map((e) => {
          let area = 0;
          let date = moment(e.createdAt).format("MMMM DD, YYYY");
          let propData = propertyList.filter((p) => {
            return p.propertyCode == e.propertyId.propertyCode;
          });

          if (propData.length) {
            if (propData[0].plotLength && propData[0].plotBreadth) {
              area =
                Number(propData[0].plotLength) *
                Number(propData[0].plotBreadth);
              area = area.toString() + propData[0].plotArea;
            } else {
              area = propData[0].totalAcre + "Acre";
            }
          }
          // console.log(propData);
          newData.push({
            _id: e._id,
            propertyId: e.propertyId._id,
            Customer: e.buyerName,
            Property: e.propertyTitle,
            Date: date,
            Email: e.buyerEmail,
            mobileNumber: e.buyerPhone,
            propertyCode: e.propertyId.propertyCode,
            propertyType: e.propertyId.propertyType,
            status: e.status,
            buyerId: e.buyerId,
            price: propData.length ? propData[0].price : "-",
            totalArea: area,
            createdAt: e.createdAt,
            updatedAt: e.updatedAt,
          });
        })
      : [];

    let pageMeta = {};
    if (inquiryData.length) {
      pageMeta = {
        total: totalRecords,
        skip: skip,
        pageSize: Math.ceil(totalRecords / parseInt(limit)),
      };
    } else {
      pageMeta = {
        total: 0,
        skip: 0,
        pageSize: 0,
      };
    }

    res.send({
      status: 200,
      message: "Enquiry list",
      data: { data: newData, pageMeta: pageMeta },
    });
  } catch (err) {
    return res.status(500).send({ status: 500, message: err.message });
  }
};
// read or view an inquiry
exports.viewInquiry = async (req, res) => {
  try {
    const _id = req.user?._id;
    const currentDate = moment().format("DD-MM-YY");
    let sellerSubs = await sellerSubModel
      .findOne({ id: _id, isActive: true, expiresAt: { $gte: currentDate } })
      .lean();
    if (!sellerSubs) {
      return res
        .status(400)
        .send({ status: 400, message: "Please buy subscription plan !" });
    }
    let inquiryId = req.body.inquiryId;
    let dataToUpdate = {
      status: "read",
    };

    let isUpdated = await enquiryModel.findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(inquiryId) },
      { $set: { ...dataToUpdate } },
      { new: true }
    );

    res.send({
      status: 200,
      message: "Inquiry list status updated",
      data: isUpdated,
    });
  } catch (err) {
    return res.status(500).send({ status: 500, message: err.message });
  }
};

// activity tracker
exports.activityTracker = async (req, res) => {
  try {
    // get all the activity tracker data
    let data = await activityTrackerModel
      .find({})
      .select({ __v: 0, updatedAt: 0 })
      .lean();

    return res.send({
      status: 200,
      message: "Activity Tacker data",
      data: data,
    });
  } catch (err) {
    return res.status(500).send({ status: 500, message: err.message });
  }
};

exports.getPropertyListing = async (req, res) => {
  try {
    let user = null;
    if (req.user) {
      user = req.user._id;
    }
    let page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 10;
    let startIndex = (page - 1) * limit;
    let endIndex = page * limit;

    const result = {};

    if (endIndex < (await Property.countDocuments().exec())) {
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
    // if (order === "ascending") {
    //   sortOrder = { [sort]: 1 };
    // } else if (order === "descending") {
    //   sortOrder = { [sort]: -1 };
    // }else {
    //         sortOrder = { createdAt: -1 };
    //       }

    if (sort === "createdAt") {
      if (order === "ascending") {
        sortOrder = { createdAt: 1, customCreatedAt: 1 };
      } else if (order === "descending") {
        sortOrder = { createdAt: -1, customCreatedAt: -1 };
      } else {
        sortOrder = { createdAt: -1, customCreatedAt: -1 };
      }
    } else {
      if (order === "ascending") {
        sortOrder = { [sort]: 1 };
      } else if (order === "descending") {
        sortOrder = { [sort]: -1 };
      } else {
        sortOrder = { createdAt: -1 };
      }
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
            { propertyTitle: { $regex: new RegExp(query), $options: "si" } },
            { state: { $regex: new RegExp(query), $options: "si" } },
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

    // Include search by postedBy company name
    if (query) {
      const sellers = await sellerModel
        .find({
          companyName: { $regex: new RegExp(`^${query}`), $options: "si" },
        })
        .select("_id");
      const sellerIds = sellers.map((seller) => seller._id);
      searchQuery.$or.push({ postedBy: { $in: sellerIds } });
    }

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
      const regexPattern = amenities.map((amenity) => new RegExp(amenity, "i"));
      const amenitiesConditions = [
        { "amenities.name": { $in: regexPattern } },
        { otherAmenities: { $in: regexPattern } },
      ];
      amenitiesQuery = { $or: amenitiesConditions };
    }

    const city = req.query.city || "";

    // If city is provided, fetch city data
    let cityType = {};
    if (city) {
      const cityData = await City.findOne({ name: city });
      if (!cityData) {
        return res
          .status(404)
          .send({ error: "City not found in the database." });
      }

      const latitude = parseFloat(cityData.latitude);
      const longitude = parseFloat(cityData.longitude);

      if (!latitude || !longitude) {
        return res
          .status(400)
          .send({ error: "Could not determine the location." });
      }

      // Find cities within a 100 km radius with their latitude and longitude
      const nearbyCities = await City.find().then((cities) =>
        cities
          .map((city) => ({
            name: city.name,
            latitude: parseFloat(city.latitude),
            longitude: parseFloat(city.longitude),
          }))
          .filter((city) => {
            const distance = geolib.getDistance(
              { latitude, longitude },
              { latitude: city.latitude, longitude: city.longitude }
            );
            return geolib.convertDistance(distance, "km") <= 100;
          })
      );

      // Extract the names of nearby cities for the filter
      const cityNames = nearbyCities.map((city) => city.name);
      cityType = cityNames.length > 0 ? { city: { $in: cityNames } } : {};
    }

    let Scity = req.query.Scity || "";
    let CityFilter = {};

    if(Scity) CityFilter = {city: Scity};

    const totalCount = await Property.find({
      ...cityType,
      ...CityFilter,
      // propertyStatus: "available",
      propertyApproval: "Resolved",
      isDeleted: false,
      status: "publish", // Exclude draft properties
    })
      .countDocuments()
      .exec();

    let priceFilter = {};
    if (req.query.price) {
      if (req.query.price === "50lac") {
        priceFilter = { price: { $lte: "5000000" } };
      } else if (req.query.price === "50lac-70lac") {
        priceFilter = { price: { $gte: "5000000", $lte: "7000000" } };
      } else if (req.query.price === "70lac-90lac") {
        priceFilter = { price: { $gte: "7000000", $lte: "9000000" } };
      } else if (req.query.price === "1cr-2cr") {
        priceFilter = { price: { $gte: "10000000", $lte: "20000000" } };
      }
    }

    let priceRange = {};
    if (req.query.priceMin && req.query.priceMax) {
      priceRange = {
        $expr: {
          $and: [
            { $gte: [{ $toDouble: "$price" }, parseFloat(req.query.priceMin)] },
            { $lte: [{ $toDouble: "$price" }, parseFloat(req.query.priceMax)] },
          ],
        },
      };
    }

    let totalAcreFilter = {};

    if (req.query.totalAcre) {
      // Clean the input using regex to remove any unwanted characters like spaces
      const totalAcre = req.query.totalAcre.replace(/\s+/g, "");

      // filtering logic based on the cleaned input
      if (totalAcre === "30") {
        totalAcreFilter = {
          $expr: {
            $lte: [
              {
                $convert: {
                  input: "$totalAcre",
                  to: "int",
                  onError: 0,
                  onNull: 0,
                },
              },
              30,
            ],
          },
        };
      } else if (totalAcre === "30-60") {
        totalAcreFilter = {
          $expr: {
            $and: [
              {
                $gte: [
                  {
                    $convert: {
                      input: "$totalAcre",
                      to: "int",
                      onError: 0,
                      onNull: 0,
                    },
                  },
                  30,
                ],
              },
              {
                $lte: [
                  {
                    $convert: {
                      input: "$totalAcre",
                      to: "int",
                      onError: 0,
                      onNull: 0,
                    },
                  },
                  60,
                ],
              },
            ],
          },
        };
      } else if (totalAcre === "60-90") {
        totalAcreFilter = {
          $expr: {
            $and: [
              {
                $gte: [
                  {
                    $convert: {
                      input: "$totalAcre",
                      to: "int",
                      onError: 0,
                      onNull: 0,
                    },
                  },
                  60,
                ],
              },
              {
                $lte: [
                  {
                    $convert: {
                      input: "$totalAcre",
                      to: "int",
                      onError: 0,
                      onNull: 0,
                    },
                  },
                  90,
                ],
              },
            ],
          },
        };
      } else if (totalAcre.toLowerCase() === "above") {
        totalAcreFilter = {
          $expr: {
            $gte: [
              {
                $convert: {
                  input: "$totalAcre",
                  to: "int",
                  onError: 0,
                  onNull: 0,
                },
              },
              90,
            ],
          },
        };
      }
    }

    // let categoryIdFilter = {};
    // if (req.query.categoryId) {
    //   console.log("Category ID filter applied:", req.query.categoryId);
    //   try {
    //     const categoryIds = req.query.categoryId
    //       .split("/")
    //       .map((id) => new ObjectId(id.trim()));
    //     categoryIdFilter = {
    //       "propertyCategory.categoryId": { $in: categoryIds },
    //     };

    //     // ✅ Check if category contains "latest", "newly", or "recently"
    //     const categories = await Category.find({ _id: { $in: categoryIds } });
    //     for (const cat of categories) {
    //       if (
    //         /latest|newly|recently/i.test(cat.name) && // match keywords
    //         cat.days // category has a "days" field
    //       ) {
    //         console.log("Days filter from category:", cat.days);

    //         // Apply days filter (createdAt >= currentDate - cat.days)
    //         const cutoffDate = new Date();
    //         cutoffDate.setDate(cutoffDate.getDate() - cat.days);
    //         categoryIdFilter.createdAt = { $gte: cutoffDate };
    //       }
    //     }


    //   } catch (error) {
    //     console.error("Invalid categoryId:", error);
    //     return res.status(400).json({ error: "Invalid categoryId" });
    //   }
    // }

    let categoryIdFilter = {};
    let specialCategoryDateFilter = {};
    let recentProperties = [];
    
    if (req.query.categoryId) {
      try {
        const categoryIds = req.query.categoryId
          .split("/")
          .map((id) => new ObjectId(id.trim()));

        categoryIdFilter = {
          "propertyCategory.categoryId": { $in: categoryIds },
        };

        const categories = await propertyCategoryModel.find(
          { _id: { $in: categoryIds } },
          { name: 1, days: 1, createdAt: 1 } // only fetch needed fields
        );

        if (!categories.length) {
          console.warn("No propertyCategory documents found for ids:", categoryIds);
        }
       
        let strictestCutoff = null;
        for (const cat of categories) {
          if (/latest|newly|recently/i.test(cat.name) && Number(cat.days) > 0) {
              const cutoff = new Date();
              cutoff.setDate(cutoff.getDate() - Number(cat.days));
              const recentProperties = await Property.find({
                createdAt: { $gte: cutoff },
                propertyApproval: "Resolved",
                isDeleted: false,
                status: "publish" // This will exclude draft properties
              });
              specialCategoryDateFilter = { createdAt: { $gte: cutoff } };
               return res.json({
                resStatus: true,
                res: recentProperties,
                count: recentProperties.length,
                filterCount: recentProperties.length
              });
            }
        }
      } catch (error) {
        console.error("Invalid categoryId:", error);
        return res.status(400).json({ error: "Invalid categoryId" });
      }
    }


    const pagination =
      page && limit ? [{ $skip: startIndex }, { $limit: parseInt(limit) }] : [];

    const promotedCondition = { isPropertyPromoted: true, prmotionType: "Add On" };
    // Fetch promoted properties separately for featureProperties
    const featureProperties = await Property.aggregate([
      {
        $match: {
          ...promotedCondition,
          propertyApproval: "Resolved",
          isDeleted: false,
        },
      },
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
          "postedBy.profilePic": 0,
          "postedBy.logo": 0,
        },
      },
    ]).exec();

    // Add saved status to feature properties
    const featurePropertiesWithSaved = await Promise.all(
      featureProperties.map(async (property) => {
        const isSaved = await Saved.exists({
          savedBy: user,
          properties: property._id,
        });
        property.saved = isSaved ? true : false;
        return property;
      })
    );
     
    let data = await Property.aggregate([
      {
        $match: {
          $or: [
            {
              $and: [
                { ...searchQuery },
                { ...filterPropertyApproval },
                { ...propertyTypeQuery },
                { ...amenitiesQuery },
                { ...cityType },
                { ...priceFilter },
                { ...priceRange },
                { ...totalAcreFilter },
                { ...categoryIdFilter },
                { ...CityFilter },
                { ...specialCategoryDateFilter },
              ],
            },
            { ...promotedCondition },
          ],
        },
      },
      {
        $match: {
          // propertyStatus: "available",
          propertyApproval: "Resolved",
          isDeleted: false,
          status: "publish", // Exclude draft properties
        },
      },
      {
        $addFields: {
          soldOutPriority: { $cond: [{ $eq: ["$propertyStatus", "sold-out"] }, 1, 0] },
        },
      },
      {
        $addFields: {
          priceAsNumber: {
            $convert: {
              input: "$price",
              to: "double",
              onError: 0,
              onNull: 0
            }
          }
        }
      },
      //{ $sort: { ...(sort === "price" ? { priceAsNumber: sortOrder[sort] } : sortOrder) } },
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
        $addFields: {
          sellerSubscription: { $arrayElemAt: ["$sellerInfo.subscription", 0] },
          priceAsNumber: {
            $convert: {
              input: "$price",
              to: "double",
              onError: 0,
              onNull: 0
            }
          },

          
        },
      },
      {
        $sort: {
          soldOutPriority: 1,
          sellerSubscription: -1,
          ...(sort === "price"
            ? { priceAsNumber: sortOrder[sort] }
            : sortOrder),
        },
      },
      {
        $project: {
          sellerInfo: 0,
          "postedBy.password": 0,
          "postedBy.verificationToken": 0,
          "postedBy.profilePic": 0,
          "postedBy.logo": 0,
        },
      },
      { $facet: { data: [...pagination] } },
    ]).exec();

    // Modify each property to include saved status directly in data
    data[0].data = await Promise.all(
      data[0].data.map(async (property) => {
        // Check if the property is saved by the user
        const isSaved = await Saved.exists({
          savedBy: user,
          properties: property._id,
        });
        // Add saved status to the property data
        property.saved = isSaved ? true : false;
        return property;
      })
    );

    const queryCount = await Property.aggregate([
      {
        $match: {
          $or: [
            {
              $and: [
                { ...searchQuery },
                { ...filterPropertyApproval },
                { ...propertyTypeQuery },
                { ...amenitiesQuery },
                { ...cityType },
                { ...priceFilter },
                { ...priceRange },
                { ...totalAcreFilter },
                { ...categoryIdFilter },
                { ...CityFilter },
              ],
            },
            { ...promotedCondition },
          ],
        },
      },
      {
        $match: {
          // propertyStatus: "available",
          propertyApproval: "Resolved",
          isDeleted: false,
          status: "publish", // Exclude draft properties
        },
      },
      { $count: "count" },
    ]).exec();

    // Extract the count value from queryCount array
    const filterCount = queryCount.length > 0 ? queryCount[0].count : 0;

    res.json({
      resStatus: true,
      count: totalCount,
      filterCount: filterCount,
      res: data[0].data,
      featureProperties: featurePropertiesWithSaved,
      
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal server error" });
  }
};


exports. getPropertyCities = async (req, res) => {
  try {
    // Determine client IP and log current city (handles proxies and localhost)
    const getClientIp = () => {
      const cfIp = req.headers["cf-connecting-ip"];
      const realIp = req.headers["x-real-ip"];
      const xff = req.headers["x-forwarded-for"];
      const candidates = []
        .concat(xff ? String(xff).split(",") : [])
        .concat(cfIp || [])
        .concat(realIp || [])
        .concat(req.connection && req.connection.remoteAddress ? [req.connection.remoteAddress] : [])
        .concat(req.socket && req.socket.remoteAddress ? [req.socket.remoteAddress] : [])
        .concat(req.connection && req.connection.socket && req.connection.socket.remoteAddress ? [req.connection.socket.remoteAddress] : []);
      const normalized = candidates
        .map((s) => String(s).trim())
        .filter(Boolean)
        .map((s) => (s.startsWith("::ffff:") ? s.replace("::ffff:", "") : s))
        .map((s) => (s === "::1" ? "127.0.0.1" : s));
      const isPrivate = (ip) => {
        return (
          ip.startsWith("10.") ||
          ip.startsWith("192.168.") ||
          /^172\.(1[6-9]|2\d|3[0-1])\./.test(ip) ||
          ip.startsWith("127.") ||
          ip === "0.0.0.0" ||
          ip.includes(":") // treat IPv6 as non-public here for simplicity
        );
      };
      const publicIp = normalized.find((ip) => !isPrivate(ip));
      return publicIp || normalized[0] || null;
    };

    const detectedIp = getClientIp();
    
    // Predeclare city with a default fallback
    let currentCity = "Delhi";
    let newCity = "delhi";
    
    // Fetch current city using the IPinfo API and normalize it
    try {
      const ipinfoUrl = detectedIp && !detectedIp.startsWith("127.")
        ? `https://ipinfo.io/${detectedIp}?token=4f0190a299c9e7`
        : `https://ipinfo.io?token=4f0190a299c9e7`;
      
      const { data: ipInfo } = await axios.get(ipinfoUrl);
      currentCity = ipInfo?.city || "Delhi";
      
      const normalizeCity = (name) =>
        String(name || "")
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "") // remove diacritics
          .replace(/[^A-Za-z\s]/g, "") // remove non-letters
          .replace(/\s+/g, " ")
          .trim();
      
      const normalizedCity = normalizeCity(currentCity);
      newCity = normalizedCity.toLowerCase();
      
      console.log("Current city by IP:", newCity, "IP:", detectedIp || "unknown");
    } catch (ipErr) {
      console.log("Could not determine city from IP:", detectedIp || "unknown", ipErr?.message);
    }

    // Allow explicit override from client for local/dev or precise control
    const requestedCity = req.query.city || req.headers["x-client-city"];
    if (requestedCity) {
      currentCity = requestedCity;
      const normalizeCity = (name) =>
        String(name || "")
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^A-Za-z\s]/g, "")
          .replace(/\s+/g, " ")
          .trim();
      
      const normalizedCity = normalizeCity(requestedCity);
      newCity = normalizedCity.toLowerCase();
      console.log("City overridden by client:", newCity);
    }

    let cities = await Property.distinct("city");
    cities = cities.map((city) =>
      city.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
    );

    cities = [...new Set(cities)];
    
    // Only add current city if it's not already in the list
    if (!cities.includes(newCity)) {
      cities.unshift(newCity);
    } else {
      // If it exists, move it to the front
      cities = cities.filter(c => c !== newCity);
      cities.unshift(newCity);
    }

    return res.status(200).send({ city: cities, currentCity: newCity });
  } catch (error) {
    console.log(error,"error");
    return res.status(500).send({ error: "Something went wrong" });
  }
};


// exports.getPropertyCities = async (req, res) => {
//   try {
//     // Retrieve the IP address from the request headers or connection
//     const forwardedFor = req.headers["x-forwarded-for"];
//     const ip = forwardedFor
//       ? forwardedFor.split(",")[0]
//       : req.connection.remoteAddress;

//     // Fetch current city using the IPinfo API and normalize it
//     const { data: ipInfo } = await axios.get(
//       `https://ipinfo.io/${ip}?token=4f0190a299c9e7`
//     );
//     const currentCity = ipInfo?.city
//       ? ipInfo.city.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
//       : "Unknown City";
//     const newCity = currentCity.toLowerCase();

//     // Fetch cities from the database
//     let cities = await Property.distinct("city");

//     // Ensure cities is an array and filter out invalid values
//     cities = (cities || [])
//       .filter((city) => typeof city === "string" && city.trim().length > 0)
//       .map((city) =>
//         city.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
//       );

//     cities = [...new Set(cities)]; // Remove duplicates

//     // Add the current city to the top of the list if not already included
//     //if (!cities.includes(newCity)) {
//       cities.unshift(newCity);
//     //}

//     return res.status(200).send({ city: cities, currentCity: newCity });
//   } catch (error) {
//     console.error("Error in getPropertyCities:", error);
//     return res.status(500).send({ error: "Something went wrong" });
//   }
// };


// exports.getPropertyCities = async (req, res) => {
//   try {
//     // Retrieve the IP address from the request headers or connection
//     const forwardedFor = req.headers["x-forwarded-for"];
//     const ip = forwardedFor
//       ? forwardedFor.split(",")[0]
//       : req.connection.remoteAddress;

//     // Fetch current city using the IPinfo API and normalize it
//     const { data: ipInfo } = await axios.get(
//       `https://ipinfo.io/${ip}?token=4f0190a299c9e7`
//     );
//     const currentCity = ipInfo?.city
//       ? ipInfo.city.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
//       : "Unknown City";
//     const newCity = currentCity.toLowerCase();

//     let cities = await Property.distinct("city");

//     // Filter out null or undefined values and normalize the city names
//     cities = cities
//       .filter((city) => city) // Ensure the city is not null or undefined
//       .map((city) =>
//         city.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
//       );

//     cities = [...new Set(cities)];

//     // Add the current city to the top of the list if not already included
//     //if (!cities.includes(newCity)) {
//       cities.unshift(newCity);
//     //}

//     return res.status(200).send({ city: cities, currentCity: newCity });
//   } catch (error) {
//     console.error("Error in getPropertyCities:", error);
//     return res.status(500).send({ error: "Something went wrong" });
//   }
// };


// subscriptionList
exports.subscriptionList = async (req, res) => {
  try {
    let data = subscriptionData;
    return res.send({
      status: 200,
      message: "Subscription List",
      data: data.subscription,
    });
  } catch (err) {
    return res.status(500).send({ status: 500, message: err.message });
  }
};

// selecting subscription plan
exports.selectPlan = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.send({ status: 422, errors: errors.array() });
    }
    const { _id } = req.user;
    const plan = req.body.plan;
    if (!errors.isEmpty()) {
    }
    let timePeriod = 6;
    if (plan === "Basic" || plan === "Silver") {
      timePeriod = 3;
    }
    let currentDate = new Date();
    let expiresAt = moment(currentDate)
      .add(timePeriod, "months")
      .format("DD-MM-YYYY");
    const dataToUpdate = {
      id: _id,
      plan: plan,
      expiresAt: expiresAt,
      expiresAt: expiresAt,
    };

    // creating subscription plan on razorpay
    let isUpdated = await sellerSubModel.findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(_id) },
      { $set: { ...dataToUpdate } },
      { upsert: true }
    );

    if (isUpdated) {
      // await sellerModel.findOneAndUpdate(
      //   { _id: new mongoose.Types.ObjectId(_id) },
      //   { $set: { subscription: true } },
      //   { upsert: true }
      // );
      return res.send({
        status: 200,
        message: "Subscription added successfully",
      });
    }
  } catch (err) {
    console.log(err);
    return res.status(500).send({ status: 500, message: err.message });
  }
};

// upgrade current plan
exports.upgradePlan = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.send({ status: 422, errors: errors.array() });
    }
    const { _id } = req.user;
    const plan = req.body.plan;
    let timePeriod = 6;
    if (plan === "Basic" || plan === "Silver") {
      timePeriod = 3;
    }
    let currentDate = new Date();
    let expiresAt = moment(currentDate)
      .add(timePeriod, "months")
      .format("DD-MM-YYYY");

    const dataToUpdate = {
      _id: _id,
      plan: plan,
      expiresAt: expiresAt,
    };

    await sellerSubModel.findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(_id) },
      { $set: { ...dataToUpdate } }
    );
    return res.send({ status: 200, message: "Plan upgrade in process" });
  } catch (err) {
    return res.status(500).send({ status: 500, message: err.message });
  }
};

// check if any existing plan
exports.existingPlan = async (req, res) => {
  try {
    let { _id } = req.user;

    let plan = await sellerSubModel
      .findOne({ id: new mongoose.Types.ObjectId(_id) })
      .lean();

    if (plan) {
      let subscriptionDetails = subscriptionData.subscription.filter(
        (name) => name.planName == plan.plan
      );
      if (subscriptionDetails.length) {
        plan = {
          ...plan,
          ...subscriptionDetails[0],
        };
      }
      return res.send({ status: 200, message: "Seller plan", data: plan });
    } else {
      return res.send({ status: 200, message: "No data found", data: {} });
    }
  } catch (err) {
    return res.status(500).send({ status: 500, message: err.message });
  }
};

// cancel subscription
exports.cancelSubscription = async (req, res) => {
  try {
    let { _id } = req.user;
    let cancelPlan = await sellerSubModel.findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(_id) },
      {
        $set: {
          isActive: false,
          plan: "",
          expiresAt: "",
        },
      },
      { new: true }
    );

    if (cancelPlan) {
      await sellerModel.findOneAndUpdate(
        { _id: new mongoose.Types.ObjectId(_id) },
        { $set: { subscription: false } }
      );
      return res.send({
        status: 200,
        message: "Subscription cancelled",
        data: cancelPlan,
      });
    } else {
      return res.send({
        status: 422,
        message: "Failed to cancel subscription",
      });
    }
  } catch (err) {
    return res.status(500).send({ status: 500, message: err.message });
  }
};

exports.editDeveloperProfile = async (req, res) => {
  try {
    console.log('editDeveloperProfile req.body:', req.body);
    console.log('editDeveloperProfile logo:', req.body.logo);
    const userId = req.user?._id;
    const user = await sellerModel.findOne({ _id: userId });
    if (!user) return res.status(400).send({ error: "User not found" });
    const {
      fullName,
      email,
      phone,
      city,
      i_am,
      logo,
      companyName,
      website,
      address,
      about,
      totalProjects,
      ongoingProjects,
      completedProjects,
      alternateNumber,
      establishedYear,
    } = req.body;

    let reg = new RegExp("^(http|https)://", "i");

    if (fullName) {
      user.fullName = fullName;
    }
    if (email) {
      user.email = email;
    }
    if (phone) {
      user.phone = phone;
    }
    if (city) {
      user.city = city;
    }
    if (i_am) {
      user.i_am = i_am;
    }

    if (logo) {
      if (!reg.test(logo)) {
        const profileResult = await uploadImage(logo);
        user.logo = profileResult.Location;
      }
    } else {
      user.logo = null; // or 'none' if you prefer
    }

    if (companyName) {
      const existingCompany = await sellerModel.findOne({
        companyName: companyName,
        _id: { $ne: userId },
      });
      if (existingCompany) {
        return res.status(400).send({ error: "Company name already exists" });
      }
      user.companyName = companyName;
    }
    if (website) {
      user.website = website;
    }
    if (address) {
      user.address = address;
    }
    if (totalProjects) {
      user.totalProjects = totalProjects;
    }
    if (about) {
      user.about = about;
    }
    if (ongoingProjects) {
      user.ongoingProjects = ongoingProjects;
    }
    if (completedProjects) {
      user.completedProjects = completedProjects;
    }
    if (alternateNumber) {
      user.alternateNumber = alternateNumber;
    }
    if (establishedYear) {
      user.establishedYear = establishedYear;
    }
    await user.save();
    return res.status(200).send({ success: "Updated Successfuly" });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ error: "Something broke" });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user?._id;
    const user = await sellerModel.findOne({ _id: userId });
    if (!user) return res.status(400).send({ error: "User not found" });
    const {
      profilePic,
      fullName,
      phone,
      email,
      city,
      notification,
      alternateNumber,
      establishedYear,
    } = req.body;

    let reg = new RegExp("^(http|https)://", "i");

    if (profilePic) {
      if (!reg.test(profilePic)) {
        const profileResult = await uploadImage(profilePic);
        user.profilePic = profileResult.Location;
      }
    }
    if (fullName) user.fullName = fullName;
    if (phone) user.phone = phone;
    if (email) user.email = email;
    if (city) user.city = city;
    if (notification) user.notification = notification;
    if (alternateNumber) user.alternateNumber = alternateNumber;
    if (establishedYear) user.establishedYear = establishedYear;

    await user.save();

    return res.status(200).send({ success: "Updated successfully" });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ error: "Something broke" });
  }
};

exports.acceptBooking = async (req, res) => {
  try {
    const bookingId = req.body.bookingId;
    const updateBooking = await bookingSlotModel.findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(bookingId) },
      { $set: { isAccepted: true } }
    );
    if (updateBooking) {
      return res.status(200).send({
        status: 200,
        message: "Booking updated successfully",
        data: updateBooking,
      });
    } else {
      return res
        .status(409)
        .send({ status: 409, message: "Failed to update booking" });
    }
  } catch (error) {
    return res.status(500).send({ message: err.message });
  }
};

exports.bookingList = async (req, res) => {
  try {
    const { _id } = req.user;

    let list = await bookingSlotModel.find({ sellerId: _id }).lean();
    if (list.length) {
      return res
        .status(200)
        .send({ status: 200, message: "Booking list", data: list });
    } else {
      return res
        .status(200)
        .send({ status: 200, message: "No booking found", data: [] });
    }
  } catch (error) {
    return res.status(500).send({ message: error.message });
  }
};

exports.saveProperties = async (req, res) => {
  try {
    const userEmail = req.user.email;
    const user = await sellerModel.findOne({ email: userEmail });
    if (!user) {
      return res.status(404).send({ status: 404, message: "User not found." });
    }
    const { properties } = req.body;
    for (const propertyId of properties) {
      if (user.properties.includes(propertyId)) {
        return res.status(400).send({ message: `This property already saved` });
      }
    }
    await Property.updateMany({ _id: { $in: properties } }, { saved: true });

    user.properties = user.properties.concat(properties);
    // Save the updated user document
    await user.save();
    return res.status(200).send({ message: "Successfully saved" });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ error: "Something broke" });
  }
};

exports.getVisitRequests = async (req, res) => {
  try {
    const userId = req.user?._id;
    const user = await sellerModel.findOne({ _id: userId });
    if (!user) {
      return res.status(404).json({ status: 404, message: "User not found." });
    }

    let page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 10;
    let startIndex = (page - 1) * limit;
    let endIndex = page * limit;

    const result = {};

    // Build filter query
    const propertyTypeFilter = req.query.propertyType || "";
    let propertyTypeQuery = {};

    if (propertyTypeFilter) {
      if (
        propertyTypeFilter === "agricultureLand" ||
        propertyTypeFilter === "Estates" ||
        propertyTypeFilter === "farmhouse" ||
        propertyTypeFilter === "farmland"
      ) {
        propertyTypeQuery = { propertyType: propertyTypeFilter };
      } else {
        return res
          .status(400)
          .send({ error: "Property type is not per requirements" });
      }
    }

    const query = req.query.query || "";
    const searchQuery = query
      ? {
          $or: [
            {
              propertyCode: { $regex: new RegExp(`^${query}`), $options: "si" },
            },
            {
              propertyType: { $regex: new RegExp(`^${query}`), $options: "si" },
            },
            {
              otherAmenities: {
                $regex: new RegExp(`^${query}`),
                $options: "si",
              },
            },
            {
              propertyTitle: {
                $regex: new RegExp(`^${query}`),
                $options: "si",
              },
            },
            { plotLength: { $regex: new RegExp(`^${query}`), $options: "si" } },
            {
              possessionStatus: {
                $regex: new RegExp(`^${query}`),
                $options: "si",
              },
            },
            {
              reraApproved: { $regex: new RegExp(`^${query}`), $options: "si" },
            },
            {
              plotBreadth: { $regex: new RegExp(`^${query}`), $options: "si" },
            },
            { price: { $regex: new RegExp(`^${query}`), $options: "si" } },
            {
              pricePerSqft: { $regex: new RegExp(`^${query}`), $options: "si" },
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
              availability: { $regex: new RegExp(`^${query}`), $options: "si" },
            },
            {
              propertyStatus: {
                $regex: new RegExp(`^${query}`),
                $options: "si",
              },
            },
            {
              propertyApproval: {
                $regex: new RegExp(`^${query}`),
                $options: "si",
              },
            },
          ],
        }
      : {};

    // Find properties posted by the user
    const properties = await Property.find({ postedBy: userId });

    // Fetch data based on filter, populate 'properties', and then populate 'postedBy' with details from the sellers collection
    const data = await Requests.find({
      properties: { $in: properties.map((prop) => prop._id) },
    })
      .populate({
        path: "requestedBy",
        model: "sellers",
      })
      .populate({
        path: "properties",
        model: "properties",
        match: {
          ...propertyTypeQuery, // Apply property type filter
          ...searchQuery, // Apply search query
        },
        // populate: {
        //   path: 'postedBy',
        //   model: 'sellers',
        // },
      })
      .skip(startIndex)
      .limit(limit);

    const filteredData = data.filter((item) => item.properties !== null); // Filter out items with null properties

    const filteredCount = filteredData.length;

    const dataArray = filteredData.map((item) => item.toObject());

    // Count the total number of properties returned for the user
    const totalCount = await Requests.find({
      properties: { $in: properties.map((prop) => prop._id) },
    })
      .countDocuments()
      .exec();

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

    return res.status(200).send({ dataArray, count: totalCount });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Something broke" });
  }
};

exports.acceptVisit = async (req, res) => {
  try {
    const seller = req.user?._id;
    if (!seller) return res.status(400).send({ error: "Seller not found" });

    const { requestId } = req.params;
    if (!requestId)
      return res.status(400).send({ error: "Request Id is required" });

    // Update the requestAccepted field in the Requests collection and mark slot as unavailable
    const accept = await Requests.findOneAndUpdate(
      { _id: requestId },
      { $set: { requestAccepted: true, "slot.available": false } },
      { new: true }
    );

    if (!accept) return res.status(400).send({ error: "Request not found" });

    // Update the accepted field and slot in the Saved collection
    const save = await Saved.findOneAndUpdate(
      { _id: accept.savedId },
      {
        $set: {
          accepted: true,
          slot: accept.slot,
          selectDate: accept.selectDate,
        },
      },
      { new: true }
    );

    if (!save)
      return res
        .status(400)
        .send({ error: "Saved property not found for the seller" });

    // Retrieve the buyer who requested the visit
    const buyer = await sellerModel.findById(accept.requestedBy);

    // Find the property to get the seller's email
    const property = await Property.findById(accept.properties);

    const emailTemplate = "accept";
    const subject = "Visit Request Accepted";
    const data = {
      Name: buyer.fullName,
      propertyName: property.propertyTitle,
    };
    await sendEmailSign(buyer.email, data, emailTemplate, subject);

    return res.status(200).send({ success: "Request Accepted", accept, save });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ error: "Something broke" });
  }
};

exports.sellerDashboardFav = async (req, res) => {
  try {
    const userId = req.user?._id;
    const user = await sellerModel.findOne({ _id: userId });
    if (!user) {
      return res.status(404).json({ status: 404, message: "User not found." });
    }

    let page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 10;
    let startIndex = (page - 1) * limit;
    let endIndex = page * limit;

    const result = {};

    // Build filter query
    const propertyTypeFilter = req.query.propertyType || "";
    let propertyTypeQuery = {};

    if (propertyTypeFilter) {
      if (
        propertyTypeFilter === "agricultureLand" ||
        propertyTypeFilter === "Estates" ||
        propertyTypeFilter === "farmhouse" ||
        propertyTypeFilter === "farmland"
      ) {
        propertyTypeQuery = { propertyType: propertyTypeFilter };
      } else {
        return res
          .status(400)
          .send({ error: "Property type is not per requirements" });
      }
    }

    const query = req.query.query || "";
    const searchQuery = query
      ? {
          $or: [
            {
              propertyCode: { $regex: new RegExp(`^${query}`), $options: "si" },
            },
            {
              propertyType: { $regex: new RegExp(`^${query}`), $options: "si" },
            },
            {
              otherAmenities: {
                $regex: new RegExp(`^${query}`),
                $options: "si",
              },
            },
            {
              propertyTitle: {
                $regex: new RegExp(`^${query}`),
                $options: "si",
              },
            },
            { plotLength: { $regex: new RegExp(`^${query}`), $options: "si" } },
            {
              possessionStatus: {
                $regex: new RegExp(`^${query}`),
                $options: "si",
              },
            },
            {
              reraApproved: { $regex: new RegExp(`^${query}`), $options: "si" },
            },
            {
              plotBreadth: { $regex: new RegExp(`^${query}`), $options: "si" },
            },
            { price: { $regex: new RegExp(`^${query}`), $options: "si" } },
            {
              pricePerSqft: { $regex: new RegExp(`^${query}`), $options: "si" },
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
              availability: { $regex: new RegExp(`^${query}`), $options: "si" },
            },
            {
              propertyStatus: {
                $regex: new RegExp(`^${query}`),
                $options: "si",
              },
            },
            {
              propertyApproval: {
                $regex: new RegExp(`^${query}`),
                $options: "si",
              },
            },
          ],
        }
      : {};

    // Find properties posted by the user
    const properties = await Property.find({ postedBy: userId });

    // Fetch data based on filter, populate 'properties', and then populate 'postedBy' with details from the sellers collection
    const data = await Saved.find({
      properties: { $in: properties.map((prop) => prop._id) },
    })
      .populate({
        path: "properties",
        match: {
          ...propertyTypeQuery,
          ...searchQuery,
        },
        // populate: {
        //   path: 'postedBy',
        //   model: 'sellers',
        // },
      })
      .skip(startIndex)
      .limit(limit);

    const filteredData = data.filter((item) => item.properties !== null);

    const filteredCount = filteredData.length;

    const dataArray = filteredData.map((item) => item.toObject());

    // Count the total number of properties returned for the user
    const totalCount = await Saved.find({
      properties: { $in: properties.map((prop) => prop._id) },
    })
      .countDocuments()
      .exec();

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

    return res.status(200).send({ dataArray, count: filteredCount });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Something broke" });
  }
};

exports.getblogLists = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;

    let result = {};

    if (endIndex < (await Blogs.countDocuments().exec())) {
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

    const query = req.query.query || "";

    const searchQuery = query
      ? {
          $or: [
            { title: { $regex: new RegExp(`${query}`, "i") } },
            { tags: { $regex: new RegExp(`${query}`, "i") } },
            { "content.content": { $regex: new RegExp(`${query}`, "i") } },
          ],
        }
      : {};

    if (req.query.featured) {
      searchQuery.featured = req.query.featured === "true";
    }

    const totalCount = await Blogs.countDocuments(searchQuery);

    const data = await Blogs.find(searchQuery)
      .populate({
        path: "categoryId",
        model: "category",
      })
      .populate({
        path: "admin",
        model: "sellers",
      })
      .skip(startIndex)
      .limit(limit);

    res.json({
      resStatus: true,
      res: data,
      count: totalCount,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ error: "Something broke" });
  }
};

exports.dashboardCounts = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) return res.status(400).send({ error: "User ID not found" });

    const savedCount = await Saved.countDocuments({
      properties: { $in: await Property.find({ postedBy: userId }) },
    });

    const postedCount = await Property.countDocuments({ postedBy: userId });

    res.json({
      savedCount,
      postedCount,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).send({ error: "Something broke!" });
  }
};

exports.addAmenities = async (req, res) => {
  try {
    const { interested } = req.user?._id;
    if (interested === "buyer") {
      return res.status(403).send({ error: "Your are not allowed" });
    }

    const url =
      "https://res.cloudinary.com/dd7lihgvm/image/upload/v1713336249/star-shape_tveifa.png"; // common for all amenities
    const { amenityName, sellerId } = req.body;
    let dataToUpdate = [];

    const amenitiesAkaName = amenityName.map((e) => {
      return e.toLowerCase();
    });

    const amenityAlreadyExists = await OtherAmenity.findOne({
      sellerId,
      "amenities.amenityAkaName": { $in: amenitiesAkaName },
    }).lean();

    if (amenityAlreadyExists) {
      return res.send({
        error: "Few amenities already exists, please remove those!",
      });
    }

    if (amenityName.length) {
      amenityName.map((e) => {
        dataToUpdate.push({
          url: url,
          amenityName: e,
          amenityAkaName: e.toLowerCase(),
        });
      });
    }

    const isUpdated = await OtherAmenity.findOneAndUpdate(
      { sellerId },
      { $push: { amenities: { $each: dataToUpdate } } },
      { upsert: true },
      { new: true }
    );
    console.log(isUpdated);
    if (isUpdated) {
      // await Property.findOneAndUpdate({ propertyId }, { $addToSet: {otherAmenities : amenityName } });
      return res.status(200).send({
        status: 200,
        message: "Amenity added successfully",
        response: isUpdated,
      });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).send({ error: "Something broke!" });
  }
};

exports.amenityListBySeller = async (req, res) => {
  try {
    const { _id } = req.user;
    console.log(_id);
    const amenityList = await OtherAmenity.find({ sellerId: _id }).lean();
    if (amenityList.length) {
      return res
        .status(200)
        .send({ status: 200, message: "Amenity List", response: amenityList });
    } else {
      return res
        .status(200)
        .send({ status: 200, message: "Amenity List", response: [] });
    }
  } catch (error) {
    return res.status(500).send({ error: error.message });
  }
};

// seller dashboard - total properties, sold properties, viewed properties
exports.sellerDashboardTotalProperties = async (req, res) => {
  try {
    const { _id } = req.user;
    const propertyList = await Property.find({ postedBy: _id })
      .select({ propertyView: 1, propertyStatus: 1 })
      .lean();

    let totalProperty = 0,
      viewedPropertyCount = 0,
      soldPropertyCount = 0;
    propertyList.map((e) => {
      totalProperty++;
      if (e.propertyStatus === "sold-out") {
        soldPropertyCount++;
      }
      if (e.propertyView) {
        viewedPropertyCount += e.propertyView;
      }
    });
    if (propertyList.length) {
      return res.status(200).send({
        message: "Seller Dashboard data",
        respounse: {
          totalProperty: totalProperty,
          viewedPropertyCount: viewedPropertyCount,
          soldPropertyCount: soldPropertyCount,
        },
      });
    }
  } catch (error) {
    return res.status(500).send({ error: error.message });
  }
};

// total number of enquiries on seller properties
exports.totalEnquiryCount = async (req, res) => {
  try {
    const { _id } = req.user;
    let list = await Property.find({ postedBy: _id }).select({
      _id: 1,
    });

    list = list.length
      ? list.map((l) => {
          return l._id;
        })
      : [];

    const enquiryCount = await enquiryModel
      .find({ propertyId: { $in: list } })
      .countDocuments()
      .exec();

    return res.status(200).send({
      success: true,
      message: "Enquiry count",
      response: enquiryCount,
    });
  } catch (error) {
    return res.status(500).send({ error: error.message });
  }
};

// most recently added properties
exports.newlyAddedProperty = async (req, res) => {
  try {
    const { _id } = req.user;
    const recentlyAddedProperty = await Property.find({
      postedBy: _id,
      propertyStatus: "new",
    })
      .select({ __v: 0 })
      .lean();

    return res.status(200).send({
      success: true,
      messagee: "Newly added property",
      response: recentlyAddedProperty,
    });
  } catch (error) {
    return res.status(500).send({ error: error.message });
  }
};

// total revenue generated date filter
exports.totalRevenueGenerated = async (req, res) => {
  try {
    const { _id } = req.user;
    const startDate = !req.query.startDate
      ? new Date()
      : new Date(req.query.startDate);
    const endDate = !req.query.endDate
      ? new Date()
      : new Date(req.query.endDate);

    const revenue = await Property.find({
      postedBy: _id,
      propertyStatus: "sold-out",
      soldOutDate: { $gte: startDate, $lte: endDate },
    })
      .select({ price: 1 })
      .lean();
    let totalRevenue = 0;
    revenue.length
      ? revenue.map((e) => {
          totalRevenue += Number(e.price);
        })
      : [];

    return res
      .status(200)
      .send({ message: "Total revenue", response: totalRevenue });
  } catch (error) {
    return res.status(500).send({ error: error.message });
  }
};

exports.deleteSellerProperty = async (req, res) => {
  try {
    const { propertyId } = req.params;
    if (!propertyId) {
      return res.status(500).send({ error: "Property not found" });
    }

    const property = await Property.findOne({ _id: propertyId });
    if (!property) {
      return res.status(400).send({ error: "Property not found" });
    }

    const seller = await sellerModel.findOne({ _id: property.postedBy });
    if (!seller) {
      return res.status(404).send({ error: "Seller not found" });
    }

    const data = await Property.findOneAndDelete({ _id: propertyId });

    // Update the seller's property count
    seller.count = Math.max(0, seller.count - 1);
    seller.promoteCount = Math.max(0, seller.promoteCount - 1);
    await seller.save();

    return res.status(200).send({ success: "Deleted successfully", data });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ error: "Something broke" });
  }
};
