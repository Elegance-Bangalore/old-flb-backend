const Property = require("../model/property.model");
const Seller = require("../model/seller.model");
const propertyCategory = require("../model/propertyCategory.model");
const Saved = require("../model/buyerSaved");
const Request = require("../model/savedProperties.js");
const Message = require("../model/message.model");
const { idNotFoundError } = require("../utils/commonValidations");
const sendEmailSign = require("../utils/emailSend.js");
const sendEmailadmin = require("../utils/adminEmail.js");
const EmailMultipleUsers = require("../utils/adminEmail.js");
const enquiryModel = require("../model/enquiry.model");
const Users = require("../model/users.model.js");
const sendEmailUsers = require("../utils/emailMultiple.js");
const axios = require("axios");
const SeoCity = require("../model/seo.js");
const PropertyView = require("../model/propertyViews.js");
const Subscription = require("../model/sellerSub.model");
const {
  uploadImage,
  uploadVideo,
  uploadPDF,
} = require("../utils/conrollerUtils");

exports.developerProperties = async (req, res) => {
  try {
    let user = null;
    if (req.user) {
      user = req.user._id;
    }
    const { sellerId } = req.params;
    const developer = await Seller.findById(sellerId);
    if (!developer) {
      return idNotFoundError(res, sellerId);
    }

    let page = parseInt(req.query.page);
    let limit = parseInt(req.query.limit);
    let startIndex = (page - 1) * limit;

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

    let availabilityFilter = {};
    if (req.query.availability) {
      if (req.query.availability === "active") {
        availabilityFilter = { availability: "active" };
      } else if (req.query.availability === "inActive") {
        availabilityFilter = { availability: "inActive" };
      }
    }

    const city = req.query.city || "";

    let cityType = city
      ? {
          city: { $regex: new RegExp(`^${city}`), $options: "si" },
        }
      : {};

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
      if (req.query.totalAcre === "30") {
        totalAcreFilter = { totalAcre: { $lte: "30" } };
      } else if (req.query.totalAcre === "30-60") {
        totalAcreFilter = { totalAcre: { $gte: "30", $lte: "60" } };
      } else if (req.query.totalAcre === "60-90") {
        totalAcreFilter = { totalAcre: { $gte: "60", $lte: "90" } };
      } else if (req.query.totalAcre === "above") {
        totalAcreFilter = { totalAcre: { $gte: "90" } };
      }
    }

    let properties = await Property.find({
      $and: [
        { postedBy: developer },
        { status: "publish" },
        {propertyApproval: "Resolved"},
        searchQuery,
        propertyTypeQuery,
        amenitiesQuery,
        priceFilter,
        availabilityFilter,
        cityType,
        priceRange,
        totalAcreFilter,
      ],
    })
      .populate({
        path: "postedBy",
        model: "sellers",
      })
      .skip(startIndex)
      .limit(limit);

    properties = await Promise.all(
      properties.map(async (property) => {
        if (user) {
          const propertyId = property._id;
          const saved = await Saved.findOne({
            savedBy: user,
            properties: propertyId,
          });
          property.saved = saved ? true : false;
        } else {
          property.saved = false;
        }

        return property;
      })
    );

    const counts = await Property.countDocuments({
      $and: [
        { postedBy: developer },
        { status: "publish" },
        {propertyApproval: "Resolved"},
        searchQuery,
        propertyTypeQuery,
        amenitiesQuery,
        priceFilter,
        availabilityFilter,
        cityType,
        priceRange,
        totalAcreFilter,
      ],
    });
    res.status(200).json({ properties, counts });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ error: "Something broke" });
  }
};

exports.getSellerSpecific = async (req, res) => {
  try {
    const { sellerId } = req.params;
    const developer = await Seller.findById(sellerId);
    if (!developer) {
      return idNotFoundError(res, sellerId);
    }
    const details = await Property.find({ postedBy: developer }).select(
      "propertyTitle _id"
    );
    return res
      .status(200)
      .send({ details, sucess: "Property details fetched" });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ error: "Something broke" });
  }
};

exports.getSellerdash = async (req, res) => {
  try {
    const { sellerId } = req.params;
    const developer = await Seller.findById(sellerId);
    if (!developer) {
      return idNotFoundError(res, sellerId);
    }
    const seller = await Seller.findOne({ _id: developer }).select(
      "city companyName logo about profilePic fullName phone email establishedYear totalProjects"
    );
    //  const totalCounts = await Property.countDocuments({postedBy: developer})
    const totalProjects = seller.totalProjects;
    const activeCounts = await Property.countDocuments({
      postedBy: developer._id,
      status: "publish",
      propertyApproval: "Resolved",
      propertyStatus: { $ne: "sold-out" },
    });
    const soldCounts = await Property.countDocuments({
      postedBy: developer._id,
      status: "publish",
      propertyApproval: "Resolved",
      propertyStatus: "sold-out",
    });
    return res.status(200).send({
      seller,
      totalCounts: totalProjects,
      activeCounts: activeCounts,
      soldCounts: soldCounts,
      success: "dashboard details fetched",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ error: "Something broke" });
  }
};

const moment = require("moment");
const cron = require("node-cron");

exports.findDayProperties = async () => {
  try {
    console.log("[findDayProperties] Function started");
    const hour = process.env.PROPERTY_HOUR || 12;
    const minute = process.env.PROPERTY_MINUTE || 32;

    const yesterdayTime = moment()
      .subtract(1, "days")
      .set({ hour, minute, second: 0, millisecond: 0 });
    const todayTime = moment().set({ hour, minute, second: 0, millisecond: 0 });

    let properties = await Property.find({
      createdAt: {
        $gte: yesterdayTime.toDate(),
        $lt: todayTime.toDate(),
      },
    });

    const count = properties.length;

    const admins = await Seller.find({ interested: "admin" });
    const recipient = admins.map((admin) => admin.email);

    const users = await Users.find({ manageProperty: true });
    const recipients = users.map((user) => user.email);

    if (count > 0) {
      const data = {
        properties: properties.map((property) => ({
          propertyName: property.propertyTitle,
          propertyType: property.propertyType,
          price: property.price,
          propertyApproval: property.propertyApproval,
          propertyCode: property.propertyCode,
        })),
        count,
      };

      await sendEmailUsers(
        recipients,
        data,
        "property-list",
        "List of properties posted today"
      );

      await sendEmailUsers(
        recipient,
        data,
        "property-list",
        "List of properties posted today"
      );
      console.log("[findDayProperties] Property list emails sent");
    } else {
      await EmailMultipleUsers(
        recipients,
        "no-property",
        `No property posted today`
      );
      await EmailMultipleUsers(
        recipient,
        "no-property",
        `No property posted today`
      );
      console.log("[findDayProperties] No property emails sent");
    }

    console.log("Properties found:", count);
    console.log("[findDayProperties] Function completed");
  } catch (error) {
    console.log("[findDayProperties] Error:", error);
  }
};

// Change the cron schedule to run every 1 minute
cron.schedule(
  `${process.env.PROPERTY_MINUTE || "32"} ${process.env.PROPERTY_HOUR || "12"} * * *`,
  async () => {
    console.log("Running cron job to find and send properties...");
    await exports.findDayProperties();
  }
);

exports.counts = async (req, res) => {
  try {
    const userId = req.user._id;

    let user = await Seller.findOne({ _id: userId });

    // Count visit requests for properties posted by the seller
    const propertyIds = await Property.find({ postedBy: user });

    const meetingsCount = await Saved.countDocuments({
      visitRequest: true,
      properties: { $in: propertyIds },
    });

    // Count inquiries for properties posted by the seller
    const inquiriesCount = await enquiryModel.countDocuments({
      propertyId: { $in: propertyIds },
    });

    const postedPropertiesCounts = await Property.countDocuments({
      postedBy: user,
    });

    return res.status(200).send({
      meetingsCount,
      inquiriesCount,
      postedPropertiesCounts,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).send({ status: 500, message: err.message });
  }
};

exports.getSellerDashboard = async (req, res) => {
  try {
    const sellerId = req.user._id;

    const { period, startDate, endDate } = req.query;
    let comparisonFilter = {};
    let dateFilter = {};
    let days = 0;

    if (period) {
      if (period === "7") days = 7;
      else if (period === "15") days = 15;
      else if (period === "30") days = 30;
    }

    if (days > 0 || (period === "custom" && startDate && endDate)) {
      let calculatedStartDate, calculatedEndDate;

      if (days > 0) {
        calculatedEndDate = new Date();
        calculatedStartDate = new Date(calculatedEndDate);
        calculatedStartDate.setDate(calculatedStartDate.getDate() - days);
      } else if (period === "custom") {
        calculatedStartDate = new Date(startDate);
        calculatedEndDate = new Date(endDate);
        calculatedEndDate.setHours(23, 59, 59, 999);

        if (
          isNaN(calculatedStartDate.getTime()) ||
          isNaN(calculatedEndDate.getTime())
        ) {
          return res.status(400).send({ error: "Invalid date format" });
        }

        days = Math.ceil(
          (calculatedEndDate - calculatedStartDate) / (1000 * 60 * 60 * 24)
        );
      }

      comparisonFilter = {
        createdAt: { $gte: calculatedStartDate, $lt: calculatedEndDate },
      };

      // Calculate the previous period's date range
      const previousPeriodEndDate = new Date(calculatedStartDate);
      const previousPeriodStartDate = new Date(previousPeriodEndDate);
      previousPeriodStartDate.setDate(previousPeriodStartDate.getDate() - days);

      dateFilter = {
        createdAt: {
          $gte: previousPeriodStartDate,
          $lt: previousPeriodEndDate,
        },
      };
    }

    // Default period filters if no specific period is applied
    const currentMonthStart = moment().startOf("month");
    const lastMonthStart = moment().subtract(1, "months").startOf("month");

    // Total properties count for this month
    const totalPropertiesThisPeriod =
      days > 0 || period === "custom"
        ? await Property.countDocuments({
            postedBy: sellerId,
            ...comparisonFilter,
          })
        : await Property.countDocuments({
            postedBy: sellerId,
            createdAt: { $gte: currentMonthStart.toDate() },
          });

    // Total properties count for last month
    const totalPropertiesLastPeriod =
      days > 0 || period === "custom"
        ? await Property.countDocuments({
            postedBy: sellerId,
            ...dateFilter,
          })
        : await Property.countDocuments({
            postedBy: sellerId,
            createdAt: {
              $gte: lastMonthStart.toDate(),
              $lt: currentMonthStart.toDate(),
            },
          });

    // Total properties count for all time
    const totalPropertiesAllTime =
      days > 0 || period === "custom"
        ? totalPropertiesThisPeriod
        : await Property.countDocuments({ postedBy: sellerId });

    // Calculate percentage change for totalProperties
    const totalPropertiesPercentageChange =
      totalPropertiesLastPeriod !== 0
        ? ((totalPropertiesThisPeriod - totalPropertiesLastPeriod) /
            totalPropertiesLastPeriod) *
          100
        : totalPropertiesThisPeriod > 0
        ? 100
        : 0;

    const totalPropertiesStatus =
      totalPropertiesThisPeriod > totalPropertiesLastPeriod ? "up" : "down";

    // Total properties sold count for this month
    const totalshortlistedThisPeriod =
    days > 0 || period === "custom"
      ? await Saved.countDocuments({
        properties: {
            $in: (
              await Property.find({ postedBy: sellerId })
            ).map((property) => property._id),
          },
          ...comparisonFilter,
        })
      : await Saved.countDocuments({
        properties: {
            $in: (
              await Property.find({ postedBy: sellerId })
            ).map((property) => property._id),
          },
          createdAt: { $gte: currentMonthStart },
        });

  // Total views count for last month
  const totalshortlistedLastPeriod =
    days > 0 || period === "custom"
      ? await Saved.countDocuments({
        properties: {
            $in: (
              await Property.find({ postedBy: sellerId })
            ).map((property) => property._id),
          },
          ...dateFilter,
        })
      : await Saved.countDocuments({
        properties: {
            $in: (
              await Property.find({ postedBy: sellerId })
            ).map((property) => property._id),
          },
          createdAt: {
            $gte: lastMonthStart.toDate(),
            $lt: currentMonthStart.toDate(),
          },
        });

  // Total views count for all time
  const totalshortlistedAllTime =
    days > 0 || period === "custom"
      ? totalshortlistedLastPeriod
      : await Saved.countDocuments({
        properties: {
            $in: (
              await Property.find({ postedBy: sellerId })
            ).map((property) => property._id),
          },
        });

  // Calculate percentage change for totalViews
  const totalshortlistedPercentageChange =
  totalshortlistedLastPeriod !== 0
      ? ((totalshortlistedThisPeriod - totalshortlistedLastPeriod) /
      totalshortlistedLastPeriod) *
        100
      : totalshortlistedThisPeriod > 0
      ? 100
      : 0;

  const totalshortlistedStatus =
  totalshortlistedThisPeriod > totalshortlistedLastPeriod ? "up" : "down";

    // Total enquiries count for this month
    const totalEnquiriesThisPeriod =
      days > 0 || period === "custom"
        ? await enquiryModel.countDocuments({
            propertyId: {
              $in: (
                await Property.find({ postedBy: sellerId })
              ).map((property) => property._id),
            },
            ...comparisonFilter,
          })
        : await enquiryModel.countDocuments({
            propertyId: {
              $in: (
                await Property.find({ postedBy: sellerId })
              ).map((property) => property._id),
            },
            createdAt: { $gte: currentMonthStart },
          });

    // Total enquiries count for last month
    const totalEnquiriesLastPeriod =
      days > 0 || period === "custom"
        ? await enquiryModel.countDocuments({
            propertyId: {
              $in: (
                await Property.find({ postedBy: sellerId })
              ).map((property) => property._id),
            },
            ...dateFilter,
          })
        : await enquiryModel.countDocuments({
            propertyId: {
              $in: (
                await Property.find({ postedBy: sellerId })
              ).map((property) => property._id),
            },
            createdAt: {
              $gte: lastMonthStart.toDate(),
              $lt: currentMonthStart.toDate(),
            },
          });

    // Total enquiries count for all time
    const totalEnquiriesAllTime =
      days > 0 || period === "custom"
        ? totalEnquiriesThisPeriod
        : await enquiryModel.countDocuments({
            propertyId: {
              $in: (
                await Property.find({ postedBy: sellerId })
              ).map((property) => property._id),
            },
          });

    // Calculate percentage change for totalEnquiries
    const totalEnquiriesPercentageChange =
      totalEnquiriesLastPeriod !== 0
        ? ((totalEnquiriesThisPeriod - totalEnquiriesLastPeriod) /
            totalEnquiriesLastPeriod) *
          100
        : totalEnquiriesThisPeriod > 0
        ? 100
        : 0;

    const totalEnquiriesStatus =
      totalEnquiriesThisPeriod > totalEnquiriesLastPeriod ? "up" : "down";

    // Total views count for this month
    const totalViewsThisPeriod =
      days > 0 || period === "custom"
        ? await PropertyView.countDocuments({
            propertyId: {
              $in: (
                await Property.find({ postedBy: sellerId })
              ).map((property) => property._id),
            },
            ...comparisonFilter,
          })
        : await PropertyView.countDocuments({
            propertyId: {
              $in: (
                await Property.find({ postedBy: sellerId })
              ).map((property) => property._id),
            },
            createdAt: { $gte: currentMonthStart },
          });

    // Total views count for last month
    const totalViewsLastPeriod =
      days > 0 || period === "custom"
        ? await PropertyView.countDocuments({
            propertyId: {
              $in: (
                await Property.find({ postedBy: sellerId })
              ).map((property) => property._id),
            },
            ...dateFilter,
          })
        : await PropertyView.countDocuments({
            propertyId: {
              $in: (
                await Property.find({ postedBy: sellerId })
              ).map((property) => property._id),
            },
            createdAt: {
              $gte: lastMonthStart.toDate(),
              $lt: currentMonthStart.toDate(),
            },
          });

    // Total views count for all time
    const totalViewsAllTime =
      days > 0 || period === "custom"
        ? totalViewsThisPeriod
        : await PropertyView.countDocuments({
            propertyId: {
              $in: (
                await Property.find({ postedBy: sellerId })
              ).map((property) => property._id),
            },
          });

    // Calculate percentage change for totalViews
    const totalViewsPercentageChange =
      totalViewsLastPeriod !== 0
        ? ((totalViewsThisPeriod - totalViewsLastPeriod) /
            totalViewsLastPeriod) *
          100
        : totalViewsThisPeriod > 0
        ? 100
        : 0;

    const totalViewsStatus =
      totalViewsThisPeriod > totalViewsLastPeriod ? "up" : "down";

    // Fetch recent properties of this seller
    const lastFiveProperties = await Property.find({ postedBy: sellerId })
      .sort({ createdAt: -1 })
      .limit(5);

    return res.status(200).json({
      success: true,
      response: {
        totalProperties: {
          thisPeriod: totalPropertiesThisPeriod,
          lastPeriod: totalPropertiesLastPeriod,
          alltime: totalPropertiesAllTime,
          change: totalPropertiesPercentageChange,
          status: totalPropertiesStatus,
        },
        propertiesSold: {
          thisPeriod: totalshortlistedThisPeriod,
          lastPeriod: totalshortlistedLastPeriod,
          alltime: totalshortlistedAllTime,
          change: totalshortlistedPercentageChange,
          status: totalshortlistedStatus,
        },
        totalEnquiries: {
          thisPeriod: totalEnquiriesThisPeriod,
          lastPeriod: totalEnquiriesLastPeriod,
          alltime: totalEnquiriesAllTime,
          change: totalEnquiriesPercentageChange,
          status: totalEnquiriesStatus,
        },
        totalViews: {
          thisPeriod: totalViewsThisPeriod,
          lastPeriod: totalViewsLastPeriod,
          alltime: totalViewsAllTime,
          change: totalViewsPercentageChange,
          status: totalViewsStatus,
        },
        recentProperties: lastFiveProperties,
      },
    });
  } catch (error) {
    console.error("Error fetching seller dashboard:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

exports.similarProperties = async (req, res) => {
  try {
    const propertyId = req.params.propertyId; // Assuming propertyId is passed as a parameter
    const property = await Property.findById(propertyId);

    if (!property) {
      return res.status(400).send({ error: "Property not found" });
    }

    // Fetch user's IP address and location details
    const { data: ipAddress } = await axios.get(
      "http://www.geoplugin.net/json.gp"
    );
    const city = ipAddress?.geoplugin_city;

    if (!city) {
      return res
        .status(400)
        .send({ error: "Unable to determine city from IP address" });
    }

    const cityRegex = new RegExp(`^${city}$`, "i");

    // Find properties in the same city
    const similarInUserCity = await Property.find({
      city: cityRegex,
      _id: { $ne: property._id },
    })
      .populate({
        path: "postedBy",
        model: "sellers",
      })
      .limit(5);
    const similarInUserCityCount = similarInUserCity.length;

    // Find properties in the property's city
    const similarInPropertyCity = await Property.find({
      city: property.city,
      _id: { $ne: property._id },
    })
      .populate({
        path: "postedBy",
        model: "sellers",
      })
      .limit(5);
    const similarInPropertyCityCount = similarInPropertyCity.length;

    //find properties of same type
    const similarPropertyType = await Property.find({
      propertyType: property.propertyType,
      _id: { $ne: property._id },
    })
      .populate({
        path: "postedBy",
        model: "sellers",
      })
      .limit(5);

    // Find all properties except the current one
    const allProperties = await Property.find({
      _id: { $ne: property._id },
    }).populate({
      path: "postedBy",
      model: "sellers",
    });

    // Find properties with similar price range
    const similarByPrice = allProperties
      .filter((prop) => {
        const propPrice = parseFloat(prop.price);
        const priceDifference =
          Math.abs(propPrice - property.price) / property.price;
        return priceDifference <= 0.05; // 5% tolerance
      })
      .slice(0, 5); // Limit to 5 properties

    const similarByPriceCount = similarByPrice.length;

    // Find properties with similar plot area
    const similarBySize = allProperties
      .filter((prop) => {
        const propSize = parseFloat(prop.totalAcre);
        const sizeDifference =
          Math.abs(propSize - property.totalAcre) / property.totalAcre;
        return sizeDifference <= 0.05; // 5% tolerance
      })
      .slice(0, 5); // Limit to 5 properties

    const similarBySizeCount = similarBySize.length;

    // Combine all similar properties into a single array
    const similarProperties = [
      ...similarInPropertyCity,
      // ...similarPropertyType,
      // ...similarInUserCity,
      ...similarByPrice,
      ...similarBySize,
    ];

    return res.status(200).send({ similarProperties: similarProperties });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ error: "Internal server error" });
  }
};

exports.addSeoCity = async (req, res) => {
  try {
    const { title, city, propertyType } = req.body;
    if (!title || !city || !propertyType) {
      return res.status(400).send({ error: "Fields are required" });
    }
    const seoCity = {
      title,
      city,
      propertyType,
    };
    const cities = await SeoCity.create(seoCity);
    return res
      .status(200)
      .send({ seoCity: cities, message: "Seo city added successfully" });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ error: "Internal server error" });
  }
};

exports.updateSeoCity = async (req, res) => {
  try {
    const seoId = req.params.seoId;
    const seoCities = await SeoCity.findById(seoId);

    if (!seoCities) {
      return res.status(404).send({ message: "Seo city not found" });
    }

    const { title, city, propertyType } = req.body;

    if (title) {
      seoCities.title = title;
    }

    if (city) {
      seoCities.city = city;
    }

    if (propertyType) {
      seoCities.propertyType = propertyType;
    }

    await seoCities.save();
    return res
      .status(200)
      .send({ seoCities, message: "Seo city updated successfully" });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ error: "Internal server error" });
  }
};

exports.getSeoCity = async (req, res) => {
  try {
    const seoCity = await SeoCity.find();
    return res.status(200).send({ seoCity });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ error: "Internal server error" });
  }
};

exports.getpropertyTypeSeoCity = async (req, res) => {
  try {
    const seoCities = await SeoCity.find().lean();
    const propertyTypes = [
      "farmland",
      "farmhouse",
      "Estates",
      "agricultureLand",
    ];
    const propertyData = {};
    for (const type of propertyTypes) {
      const matchingCities = seoCities.filter(
        (city) => city.propertyType === type
      );
      propertyData[type] = matchingCities;
    }
    res.status(200).json({ data: propertyData });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: "Internal server error" });
  }
};

exports.deleteSeoCity = async (req, res) => {
  try {
    const seoId = req.params.seoId;
    const seoCity = await SeoCity.findByIdAndDelete(seoId);
    return res
      .status(200)
      .send({ seoCity, message: "Seo city deleted successfully" });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ error: "Internal server error" });
  }
};

exports.getProperties = async (req, res) => {
  try {
    const properties = await Property.find().select("_id propertyTitle");
    const count = properties.length;
    return res.status(200).send({ properties, count: count });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ error: "Internal server error" });
  }
};

exports.markPropertyPromoted = async (req, res) => {
  try {
    const propertyId = req.params.propertyId;
    const property = await Property.findById(propertyId);

    if (!property) {
      return res.status(404).send({ message: "Property not found" });
    }

    const { type, propertyAds, promoteExpires, prmotionType, promotionCity } =
      req.body;

    if (type === "add") {
      if (property.isPropertyPromoted) {
        return res
          .status(400)
          .send({ message: "Property is already promoted" });
      }

      if (!propertyAds) {
        return res
          .status(400)
          .send({ message: "Image is required to promote the property" });
      }
      const imageResult = await uploadImage(propertyAds);
      property.propertyAds = imageResult.Location;
      property.isPropertyPromoted = true;
      property.promoteExpires = promoteExpires;
      property.prmotionType = prmotionType;
      property.promotionCity = promotionCity;
    } else if (type === "remove") {
      if (!property.isPropertyPromoted) {
        return res.status(400).send({ message: "Property is not promoted" });
      }

      property.propertyAds = null;
      property.isPropertyPromoted = false;
      property.promoteExpires = null;
      property.prmotionType = null;
    } else {
      return res
        .status(400)
        .send({ message: "Invalid type. Type must be 'add' or 'remove'." });
    }

    await property.save();

    const message = property.isPropertyPromoted
      ? "Property promoted successfully"
      : "Property removed from promoted list successfully";

    return res.status(200).send({ property, message });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ error: "Internal server error" });
  }
};

exports.sellerMarkPropertyPromoted = async (req, res) => {
  try {
    const user = await Seller.findOne({ _id: req.user._id });
    const propertyId = req.params.propertyId;
    const property = await Property.findOne({_id: propertyId, propertyApproval : "Resolved"});

    if (!property) {
      return res.status(404).send({ message: "Property not approved" });
    }

    const { type, propertyAds } = req.body;

    if (type === "add") {
      if (property.isPropertyPromoted) {
        return res
          .status(400)
          .send({ message: "Property is already promoted" });
      }

      if (user.promoteCount === 1) {
        return res
          .status(400)
          .send({ message: "You can only promote one property" });
      }

      if (!propertyAds) {
        return res
          .status(400)
          .send({ message: "Image is required to promote the property" });
      }

      const imageResult = await uploadImage(propertyAds);
      property.propertyAds = imageResult.Location;
      property.isPropertyPromoted = true;
      property.promotionCity = property.city;
      property.prmotionType = "Curated Deal"

      const isPromoteExpires = await Subscription.findOne({
        id: req.user._id,
      });
      const expiresAtStr = isPromoteExpires.expiresAt;
      const [day, month, year] = expiresAtStr.split("-");
      const expiresAtDate = new Date(year, month - 1, day);
      if (isNaN(expiresAtDate.getTime())) {
        return res
          .status(400)
          .json({ error: "Invalid date format for expiresAt" });
      }
      property.promoteExpires = expiresAtDate;
      const seller = await Seller.findOneAndUpdate(
        { _id: req.user._id },
        { $inc: { promoteCount: 1 } },
        { new: true }
      );
    } else if (type === "remove") {
      if (!property.isPropertyPromoted) {
        return res.status(400).send({ message: "Property is not promoted" });
      }
      await Seller.findOneAndUpdate(
        { _id: req.user._id },
        { $inc: { promoteCount: -1 } }, // Decrease promoteCount
        { new: true }
      );
      property.propertyAds = null;
      property.isPropertyPromoted = false;
      property.promoteExpires = null;
    } else {
      return res
        .status(400)
        .send({ message: "Invalid type. Type must be 'add' or 'remove'." });
    }

    await property.save();

    const message = property.isPropertyPromoted
      ? "Property promoted successfully"
      : "Property removed from promoted list successfully";

    return res.status(200).send({ property, message });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ error: "Internal server error" });
  }
};

exports.updateSellerPromoted = async (req, res) => {
  try {
    const propertyId = req.params.propertyId;
    const property = await Property.findById(propertyId);

    if (!property) {
      return res.status(404).send({ message: "Property not found" });
    }

    const { propertyAds } = req.body;
    const re = new RegExp("^(http|https)://", "i");
    if (propertyAds && !re.test(propertyAds)) {
      const imageResult = await uploadImage(propertyAds);
      property.propertyAds = imageResult.Location;
    }
    property.isPropertyPromoted = true;

    const isPromoteExpires = await Subscription.findOne({
      id: req.user._id,
    });
    const expiresAtStr = isPromoteExpires.expiresAt;
    const [day, month, year] = expiresAtStr.split("-");
    const expiresAtDate = new Date(year, month - 1, day);
    if (isNaN(expiresAtDate.getTime())) {
      return res
        .status(400)
        .json({ error: "Invalid date format for expiresAt" });
    }
    property.promoteExpires = expiresAtDate;
    const seller = await Seller.findOneAndUpdate(
      { _id: req.user._id },
      { $inc: { promoteCount: 1 } },
      { new: true }
    );

    await property.save();

    return res.status(200).send({ property, message: "Successfully updated" });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ error: "Internal server error" });
  }
};

exports.updatePromotedProperty = async (req, res) => {
  try {
    const propertyId = req.params.propertyId;
    const property = await Property.findById(propertyId);

    if (!property) {
      return res.status(404).send({ message: "Property not found" });
    }

    let re = new RegExp("^(http|https)://", "i");

    const { propertyAds, promoteExpires, prmotionType, promotionCity } =
      req.body;

    if (propertyAds && !re.test(propertyAds)) {
      const imageResult = await uploadImage(propertyAds);
      property.propertyAds = imageResult.Location;
    }
    if (promoteExpires) {
      property.promoteExpires = promoteExpires;
    }
    if (prmotionType) {
      property.prmotionType = prmotionType;
    }
    if (promotionCity) {
      property.promotionCity = promotionCity;
    }

    await property.save();
    return res
      .status(200)
      .send({ property: property, message: "Updated Successfully" });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ error: "Internal server error" });
  }
};

exports.sendNotifications = async () => {
  try {
    const fortyEightHoursAgo = moment().subtract(48, "hours").toDate();
    const seventyTwoHoursAgo = moment().subtract(96, "hours").toDate();

    // Find all requests older than 48 hours but no notification sent yet (for the first email)
    const firstNotificationRequests = await Request.find({
      requestAccepted: false,
      requestTime: { $lte: fortyEightHoursAgo },
      notificationSentCount: 0, // No notification sent yet
    });

    // Find all requests older than 72 hours but only one notification has been sent (for the second email)
    const secondNotificationRequests = await Request.find({
      requestAccepted: false,
      requestTime: { $lte: seventyTwoHoursAgo },
      notificationSentCount: 1,
    });

    const allRequests = [
      ...firstNotificationRequests,
      ...secondNotificationRequests,
    ];
    const propertyIds = allRequests.map((request) => request.properties);
    const properties = await Property.find({
      _id: { $in: propertyIds.flat() },
    });
    const userIds = properties.map((property) => property.postedBy);
    const users = await Seller.find(
      { _id: { $in: userIds } },
      "email fullName"
    );

    for (const user of users) {
      const userProperties = properties.filter(
        (property) => String(property.postedBy) === String(user._id)
      );
      const propertyTitles = userProperties.map(
        (property) => property.propertyTitle
      );

      const emailData = {
        Name: user.fullName,
        PropertyName: propertyTitles.join(", "),
      };

      const recipients = users.map((user) => user.email);

      // Send the first email for requests older than 48 hours with no notification sent
      const userFirstRequests = firstNotificationRequests.filter((request) =>
        userProperties.some(
          (property) => String(property._id) === String(request.properties)
        )
      );
      if (userFirstRequests.length > 0) {
        await sendEmailUsers(
          recipients,
          emailData,
          "reminder",
          "Reminder For Pending Buyer Meeting Request"
        );
        for (const request of userFirstRequests) {
          await Request.updateOne(
            { _id: request._id },
            { $inc: { notificationSentCount: 1 } }
          );
        }
      }

      // Send the second email for requests older than 72 hours with one notification already sent
      const userSecondRequests = secondNotificationRequests.filter((request) =>
        userProperties.some(
          (property) => String(property._id) === String(request.properties)
        )
      );
      if (userSecondRequests.length > 0) {
        await sendEmailUsers(
          recipients,
          emailData,
          "reminder",
          "Final Reminder: Pending Buyer Meeting Request"
        );
        for (const request of userSecondRequests) {
          await Request.updateOne(
            { _id: request._id },
            { $inc: { notificationSentCount: 1 } }
          );
        }
      }
    }

    console.log(
      "Notifications sent successfully and notification count updated"
    );
  } catch (error) {
    console.error("Error sending notifications:", error);
  }
};

// Schedule the cron job to send notifications at a specified time
cron.schedule(
  `${process.env.NOTIFICATION_MINUTE || "0"} ${
    process.env.NOTIFICATION_HOUR || "8"
  } * * *`,
  async () => {
    console.log("Running cron job to send notifications...");
    await exports.sendNotifications();
  }
);

exports.sendChatNotifications = async (req, res) => {
  try {
    const fortyEightHoursAgo = moment().subtract(48, "hours").toDate();
    const seventyTwoHoursAgo = moment().subtract(72, "hours").toDate();

    // Find all unread messages older than 48 hours but no notification sent yet (first notification)
    const firstNotificationMessages = await Message.find({
      isRead: false,
      createdAt: { $lte: fortyEightHoursAgo },
      notificationSentCount: 0, // No notification sent yet
    });

    // Find all unread messages older than 72 hours but only one notification has been sent (second notification)
    const secondNotificationMessages = await Message.find({
      isRead: false,
      createdAt: { $lte: seventyTwoHoursAgo },
      notificationSentCount: 1, // First notification already sent
    });

    const allUnreadMessages = [
      ...firstNotificationMessages,
      ...secondNotificationMessages,
    ];
    const receiverIds = allUnreadMessages.map((message) => message.receiverId);
    const propertyIds = allUnreadMessages.map((message) => message.propertyId);

    const users = await Seller.find(
      { _id: { $in: receiverIds }, interested: "sell" },
      "email fullName"
    );
    const properties = await Property.find(
      { _id: { $in: propertyIds } },
      "propertyTitle"
    );

    const emailSubject = "You have unread chat messages";
    const emailTemplate = "chatReminder";

    for (const user of users) {
      const userMessages = allUnreadMessages.filter(
        (message) => String(message.receiverId) === String(user._id)
      );
      const messagePreviews = userMessages
        .map((message) => message.message.substring(0, 30))
        .join(", ");
      const propertyTitles = userMessages
        .map((message) => {
          const property = properties.find(
            (property) => String(property._id) === String(message.propertyId)
          );
          return property ? property.propertyTitle : "Unknown Property";
        })
        .join(", ");

      const emailData = {
        Name: user.fullName,
        message: messagePreviews,
        PropertyName: propertyTitles,
      };

      const recipients = [user.email];

      // Send the first notification for unread messages older than 48 hours
      const userFirstMessages = firstNotificationMessages.filter(
        (message) => String(message.receiverId) === String(user._id)
      );
      if (userFirstMessages.length > 0) {
        await sendEmailUsers(
          recipients,
          emailData,
          emailTemplate,
          emailSubject
        );
        for (const message of userFirstMessages) {
          await Message.updateOne(
            { _id: message._id },
            { $inc: { notificationSentCount: 1 } }
          );
        }
      }

      // Send the second notification for unread messages older than 72 hours
      const userSecondMessages = secondNotificationMessages.filter(
        (message) => String(message.receiverId) === String(user._id)
      );
      if (userSecondMessages.length > 0) {
        await sendEmailUsers(
          recipients,
          emailData,
          emailTemplate,
          emailSubject
        );
        for (const message of userSecondMessages) {
          await Message.updateOne(
            { _id: message._id },
            { $inc: { notificationSentCount: 1 } }
          );
        }
      }
    }

    res.status(200).send({ message: "Chat notifications sent successfully" });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ error: "Internal server error" });
  }
};

cron.schedule(
  `${process.env.CHAT_NOTIFICATION_MINUTE || "0"} ${
    process.env.CHAT_NOTIFICATION_HOUR || "8"
  } * * *`,
  async () => {
    console.log("Running cron job to send notifications...");
    await exports.sendChatNotifications();
  }
);

exports.updateFetauredImage = async (req, res) => {
  try {
    const propertyId = req.params.propertyId;
    const { heroImage } = req.body;

    const re = new RegExp("^(http|https)://", "i");

    const property = await Property.findById(propertyId);
    if (!property) {
      return res.status(404).send({ error: "Property not found" });
    }

    let heroImageUrl = "";
    if (heroImage && !re.test(heroImage)) {
      const heroImageResult = await uploadImage(heroImage);
      heroImageUrl = heroImageResult.Location;
    }

    property.heroImage = heroImageUrl;

    await property.save();
    res
      .status(200)
      .send({ property, message: "Featured image updated successfully" });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ error: "Internal server error" });
  }
};
