const Blogs = require("../model/blogs");
const Footer = require("../model/manageFooter");
const Faq = require("../model/faqs");
const Property = require("../model/property.model");
const propertyCategory = require("../model/propertyCategory.model");
const Saved = require("../model/buyerSaved");
const Carousel = require("../model/carousel");
const BannerClick = require("../model/bannerClicks");
const { uploadImage, uploadVideo } = require("../utils/conrollerUtils");
const axios = require("axios");
const os = require("os");
const requestIp = require("request-ip");
const geolib = require("geolib");
const {
  idNotFoundError,
  validateId,
  validateFields,
  validateFound,
} = require("../utils/commonValidations");
const Category = require("../model/category");
const SubCategory = require("../model/blogSubCategory");
const Seller = require('../model/seller.model');
const Enquiry = require('../model/enquiry.model');

const mongoose = require("mongoose");
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

exports.getblogLists = async (req, res) => {
  try {
    const page = parseInt(req.query.page);
    const limit = parseInt(req.query.limit);
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;

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
    const categoryId = req.query.categoryId || "";
    const subCategoryId = req.query.subCategoryId || "";

    const searchQuery = {
      $and: [
        query
          ? {
              $or: [
                { title: { $regex: new RegExp(`${query}`, "i") } },
                { "content.content": { $regex: new RegExp(`${query}`, "i") } },
              ],
            }
          : {},
        categoryId ? { categoryId: categoryId } : {},
        subCategoryId ? { subCategory: subCategoryId } : {},
        req.query.featured ? { featured: req.query.featured === "true" } : {},
        { status: "publish" },
      ],
    };

    const totalCount = await Blogs.countDocuments(searchQuery);

    const data = await Blogs.find(searchQuery)
      .populate({
        path: "categoryId",
        model: "category",
      })
      .populate({
        path: "subCategory",
        model: "subcategory",
      })
      .sort(sortOrder)
      .skip(startIndex)
      .limit(limit)
      .lean();

    // Manual population of admin field
    const adminIds = data.map((blog) => blog.admin);
    const sellers = await mongoose
      .model("sellers")
      .find({ _id: { $in: adminIds } })
      .lean();
    const users = await mongoose
      .model("user")
      .find({ _id: { $in: adminIds } })
      .lean();

    const allAdmins = [...sellers, ...users].reduce((acc, admin) => {
      acc[admin._id] = admin;
      return acc;
    }, {});

    const populatedData = data.map((blog) => {
      blog.admin = allAdmins[blog.admin];
      return blog;
    });

    res.json({
      resStatus: true,
      res: populatedData,
      count: totalCount,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ error: "Something broke" });
  }
};

exports.gethomeFooter = async (req, res) => {
  try {
    const page = parseInt(req.query.page);
    const limit = parseInt(req.query.limit);
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;

    let result = {};

    if (endIndex < (await Footer.countDocuments().exec())) {
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
          $or: [{ title: { $regex: new RegExp(`${query}`, "i") } }],
        }
      : {};

    const totalCount = await Footer.find({ status: true, ...searchQuery })
      .countDocuments()
      .exec();

    const data = await Footer.find({ status: true, ...searchQuery })
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

exports.gethomeFaqs = async (req, res) => {
  try {
    const page = parseInt(req.query.page);
    const limit = parseInt(req.query.limit);
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;

    let result = {};

    if (endIndex < (await Faq.countDocuments().exec())) {
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
    const category = req.query.category || "";

    const searchQuery = {
      ...(query
        ? {
            $or: [
              { question: { $regex: new RegExp(`${query}`, "i") } },
              { answers: { $regex: new RegExp(`${query}`, "i") } },
            ],
          }
        : {}),
      ...(category ? { category: category } : {}),
    };

    const totalCount = await Faq.find(searchQuery).countDocuments().exec();

    const data = await Faq.find(searchQuery)
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

exports.getMostSearched = async (req, res) => {
  try {
    let page = parseInt(req.query.page);
    let limit = parseInt(req.query.limit);
    let startIndex = (page - 1) * limit;
    let endIndex = page * limit;
    let propertyTypeFilter = req.query.propertyType || "";
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

    //let propertyCount = await Property.countDocuments({ propertyStatus: "available", propertyApproval: "Resolved", isDeleted : false, ...propertyTypeQuery });

    let topProperties = await Property.find({
      propertyApproval: "Resolved",
      isDeleted: false,
      propertyStatus: { $ne: "sold-out" },
      ...propertyTypeQuery,
    })
      .populate({
        path: "postedBy",
        model: "sellers",
        select: "-logo -profilePic",
      })
      .sort({ propertyView: -1 })
      .skip(startIndex)
      .limit(5)
      .exec();

    return res.status(200).send({
      resStatus: true,
      mostSearched: topProperties,
      //count: propertyCount,
      message: "Property details fetched successfully!",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ error: "Something broke" });
  }
};

function getLocalIpAddress() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const net of interfaces[name]) {
      if (net.family === "IPv4" && !net.internal) {
        return net.address;
      }
    }
  }
  return "127.0.0.1"; // fallback if no external IP is found
}

// exports.getCuratedDeals = async (req, res) => {
//   try {
//     let user = null;
//     if (req.user) {
//       user = req.user._id;
//     }

//     // Get the user's IP from headers (try X-Forwarded-For, or fallback to remote address)
//     const forwardedFor = req.headers["x-forwarded-for"];
//     const ip = forwardedFor
//       ? forwardedFor.split(",")[0]
//       : req.connection.remoteAddress;

//     // Use a more reliable geolocation service (IP-API) with the user's IP
//     const { data: ipInfo } = await axios.get(
//       `https://ipinfo.io/${ip}?token=4f0190a299c9e7`
//     );

//     // Ensure fallback for internal/local IPs
//     const localIp = getLocalIpAddress();

//     // Extract user location information
//     const location = {
//       localIp,
//       ip: ip || localIp, // Use external IP if available, fallback to local
//       city: ipInfo?.city || "Unknown City",
//       countryCode: ipInfo?.country_code || "Unknown",
//       countryName: ipInfo?.country_name || "Unknown",
//       principalSubdivision: ipInfo?.region || "Unknown Region",
//       principalSubdivisionCode: ipInfo?.region_code || "Unknown Code",
//     };

//     const currentDate = new Date();

//     // Fetch promoted properties based on city
//     let topProperties = [];
//     let propertyCount = 0;

//     if (location.city && location.city !== "Unknown City") {
//       // Fetch promoted property count in user's city
//       propertyCount = await Property.countDocuments({
//         isPropertyPromoted: true,
//         city: location.city,
//         prmotionType: "Curated Deal",
//         promoteExpires: { $gt: currentDate },
//         propertyStatus: { $ne: "sold-out" },
//       });

//       // Fetch promoted properties in user's city
//       topProperties = await Property.find({
//         isPropertyPromoted: true,
//         city: location.city,
//         prmotionType: "Curated Deal",
//         promoteExpires: { $gt: currentDate },
//         propertyStatus: { $ne: "sold-out" },
//       })
//         .populate({
//           path: "postedBy",
//           model: "sellers",
//           select: "-logo -profilePic",
//         })
//         .sort({ createdAt: -1 })
//         .exec();
//     }

//     // If no properties are found in the user's city, fetch from other locations
//     if (topProperties.length === 0) {
//       // Fetch promoted property count from other locations
//       propertyCount = await Property.countDocuments({
//         isPropertyPromoted: true,
//         prmotionType: "Curated Deal",
//         promoteExpires: { $gt: currentDate },
//         propertyStatus: { $ne: "sold-out" },
//       });

//       // Fetch promoted properties from other locations
//       topProperties = await Property.find({
//         isPropertyPromoted: true,
//         prmotionType: "Curated Deal",
//         promoteExpires: { $gt: currentDate },
//         propertyStatus: { $ne: "sold-out" },
//       })
//         .populate({
//           path: "postedBy",
//           model: "sellers",
//           select: "-logo -profilePic",
//         })
//         .sort({ createdAt: -1 })
//         .exec();
//     }

//     // Mark saved properties for the user, if logged in
//     topProperties = await Promise.all(
//       topProperties.map(async (property) => {
//         if (user) {
//           const propertyId = property._id.toString();
//           const saved = await Saved.findOne({
//             savedBy: user,
//             properties: propertyId,
//           });
//           property.saved = saved ? true : false;
//         } else {
//           property.saved = false;
//         }
//         return property;
//       })
//     );

//     // Respond with curated deals and location info
//     return res.status(200).send({
//       resStatus: true,
//       curatedDeals: topProperties,
//       count: propertyCount,
//       message: "Property details fetched successfully!",
//       location,
//     });
//   } catch (error) {
//     console.error(error);
//     return res
//       .status(500)
//       .send({ error: "An error occurred while fetching curated deals." });
//   }
// };

exports.getCuratedDeals = async (req, res) => {
  try {
    let user = null;
    if (req.user) {
      user = req.user._id;
    }

    const currentDate = new Date();

    // Fetch promoted properties from anywhere (skip IP/location logic)
    let propertyCount = await Property.countDocuments({
      isPropertyPromoted: true,
      prmotionType: "Curated Deal",
      promoteExpires: { $gt: currentDate },
      propertyStatus: { $ne: "sold-out" },
    });

    let topProperties = await Property.find({
      isPropertyPromoted: true,
      prmotionType: "Curated Deal",
      promoteExpires: { $gt: currentDate },
      propertyStatus: { $ne: "sold-out" },
    })
      .populate({
        path: "postedBy",
        model: "sellers",
        select: "-logo -profilePic",
      })
      .sort({ createdAt: -1 })
      .exec();

    // Mark saved properties for the user, if logged in
    topProperties = await Promise.all(
      topProperties.map(async (property) => {
        if (user) {
          const propertyId = property._id.toString();
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

    // Default location object (since IP logic removed)
    const location = {
      ip: "N/A",
      city: "Unknown City",
      countryCode: "Unknown",
      countryName: "Unknown",
      principalSubdivision: "Unknown Region",
      principalSubdivisionCode: "Unknown Code",
    };

    // Respond with curated deals + location
    return res.status(200).send({
      resStatus: true,
      curatedDeals: topProperties,
      count: propertyCount,
      message: "Property details fetched successfully!",
      location,
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .send({ error: "An error occurred while fetching curated deals." });
  }
};

exports.getAdminCuratedDeals = async (req, res) => {
  try {
    let user = null;
    if (req.user) {
      user = req.user._id;
    }
    let propertyCount = await Property.countDocuments({
      isPropertyPromoted: true,
      propertyStatus: { $ne: "sold-out" },
    });
    let topProperties = await Property.find({ 
      isPropertyPromoted: true,
      propertyStatus: { $ne: "sold-out" },
    })
      .populate({
        path: "postedBy",
        model: "sellers",
        select: "-logo -profilePic",
      })
      // .sort({ propertyView: -1 })
      // .limit(10)
      .exec();

    topProperties = await Promise.all(
      topProperties.map(async (property) => {
        if (user) {
          const propertyId = property._id.toString();
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

    return res.status(200).send({
      resStatus: true,
      curatedDeals: topProperties,
      count: propertyCount,
      message: "Property details fetched successfully!",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ error: "Something broke" });
  }
};

exports.getCategoryProperties = async (req, res) => {
  console.log("getCategoryProperties called.............");
  try {
    let user = null;
    if (req.user) {
      user = req.user._id;
    }

    // Retrieve the IP address from the request headers or connection
    // const forwardedFor = req.headers["x-forwarded-for"];
    // const ip = forwardedFor
    //   ? forwardedFor.split(",")[0]
    //   : req.connection.remoteAddress;

    // // Use IPinfo to get geolocation data for the user's IP
    // const { data: ipInfo } = await axios.get(
    //   `https://ipinfo.io/${ip}?token=4f0190a299c9e7`
    // );
    // const currentCity = ipInfo?.city
    // ? ipInfo.city.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    // : "Delhi";

    // // const cityData = await City.findOne({ name: currentCity });
    // // if (!cityData) {
    // //   return res.status(404).send({ error: "City not found in the database." });
    // // }

    // // const latitude = parseFloat(cityData.latitude);
    // // const longitude = parseFloat(cityData.longitude);

    // // if (!latitude || !longitude) {
    // //   return res.status(400).send({ error: "Could not determine the location." });
    // // }

    // // //cities within a 100 km radius with their latitude and longitude
    // // const nearbyCities = await City.find().then((cities) =>
    // //   cities
    // //     .map((city) => ({
    // //       name: city.name,
    // //       latitude: parseFloat(city.latitude),
    // //       longitude: parseFloat(city.longitude),
    // //     }))
    // //     .filter((city) => {
    // //       const distance = geolib.getDistance(
    // //         { latitude, longitude },
    // //         { latitude: city.latitude, longitude: city.longitude }
    // //       );
    // //       return geolib.convertDistance(distance, "km") <= 100;
    // //     })
    // // );

    // // //properties in nearby cities
    // // const cityNames = nearbyCities.map((city) => city.name);

    const query = req.query.query || "";
    
    let searchQuery = query
      ? {
          $or: [
            {
              "properties.city": { $regex: new RegExp(query), $options: "si" },
            },
          ],
        }
      : {};

    // Get saved properties by the user
    const savedProperties = await Saved.find({ savedBy: user }).distinct(
      "properties"
    );

    // Query for categories with properties matching the current city
    let categoriesWithCount = await propertyCategory.aggregate([
      {
        $match: { visible: true },
      },
      {
        $lookup: {
          from: "properties",
          localField: "_id",
          foreignField: "propertyCategory.categoryId",
          as: "properties",
        },
      },
      // {
      //   $addFields: {
      //     propertyCount: { $size: "$properties" },
      //   },
      // },
      {
        $unwind: { path: "$properties", preserveNullAndEmptyArrays: true },
      },
      {
        $match: {
          "properties.propertyApproval": "Resolved",
          "properties.isDeleted": false,
          "properties.propertyStatus": { $ne: "sold-out" }, // Exclude sold-out properties
          ...searchQuery,
        },
      },
      {
        $lookup: {
          from: "sellers",
          localField: "properties.postedBy",
          foreignField: "_id",
          as: "properties.postedBy",
        },
      },
      {
        $project: {
          "properties.postedBy.logo": 0,
          "properties.postedBy.profilePic": 0,
        },
      },
      {
        $addFields: {
          "properties.postedBy": { $arrayElemAt: ["$properties.postedBy", 0] },
        },
      },
      {
        $group: {
          _id: "$_id",
          name: { $first: "$name" },
          categoryName: { $first: "$categoryName" },
          visible: { $first: "$visible" },
          description: { $first: "$description" },
          order: { $first: "$order" },
          propertyCount: {
            $sum: {
              $cond: [{ $gt: [{ $type: "$properties._id" }, "missing"] }, 1, 0],
            },
          }, // Count valid properties
          properties: { $push: "$properties" },
        },
      },
      {
        $project: {
          _id: 1,
          name: 1,
          categoryName: 1,
          visible: 1,
          description: 1,
          order: 1,
          propertyCount: 1,
          properties: {
            $cond: {
              if: { $gt: ["$propertyCount", 0] },
              then: {
                $map: {
                  input: "$properties",
                  as: "property",
                  in: {
                    $mergeObjects: [
                      "$$property",
                      {
                        saved: {
                          $in: ["$$property._id", savedProperties],
                        },
                      },
                    ],
                  },
                },
              },
              else: [],
            },
          },
        },
      },
      {
        $match: {
          propertyCount: { $gt: 0 },
        },
      },
      {
        $sort: { order: 1 },
      },
    ]);

    // If no properties match the current city, fallback to other properties
    if (categoriesWithCount.length === 0) {
      categoriesWithCount = await propertyCategory.aggregate([
        // Similar pipeline as above but without the current city match
        {
          $match: { visible: true },
        },
        {
          $lookup: {
            from: "properties",
            localField: "_id",
            foreignField: "propertyCategory.categoryId",
            as: "properties",
          },
        },
        // {
        //   $addFields: {
        //     propertyCount: { $size: "$properties" },
        //   },
        // },
        {
          $unwind: { path: "$properties", preserveNullAndEmptyArrays: true },
        },
        {
          $match: {
            "properties.propertyApproval": "Resolved",
            "properties.isDeleted": false,
            "properties.propertyStatus": { $ne: "sold-out" }, // Exclude sold-out properties
            ...searchQuery,
          },
        },
        {
          $lookup: {
            from: "sellers",
            localField: "properties.postedBy",
            foreignField: "_id",
            as: "properties.postedBy",
          },
        },
        {
          $project: {
            "properties.postedBy.logo": 0,
            "properties.postedBy.profilePic": 0,
          },
        },
        {
          $addFields: {
            "properties.postedBy": {
              $arrayElemAt: ["$properties.postedBy", 0],
            },
          },
        },
        {
          $group: {
            _id: "$_id",
            name: { $first: "$name" },
            categoryName: { $first: "$categoryName" },
            visible: { $first: "$visible" },
            description: { $first: "$description" },
            order: { $first: "$order" },
            // propertyCount: { $first: "$propertyCount" },
            propertyCount: {
              $sum: {
                $cond: [
                  { $gt: [{ $type: "$properties._id" }, "missing"] },
                  1,
                  0,
                ],
              },
            }, // Count valid properties
            properties: { $push: "$properties" },
          },
        },
        {
          $project: {
            _id: 1,
            name: 1,
            categoryName: 1,
            visible: 1,
            description: 1,
            order: 1,
            propertyCount: 1,
            properties: {
              $cond: {
                if: { $gt: ["$propertyCount", 0] },
                then: {
                  $map: {
                    input: "$properties",
                    as: "property",
                    in: {
                      $mergeObjects: [
                        "$$property",
                        {
                          saved: {
                            $in: ["$$property._id", savedProperties],
                          },
                        },
                      ],
                    },
                  },
                },
                else: [],
              },
            },
          },
        },
        {
          $match: {
            propertyCount: { $gt: 0 },
          },
        },
        {
          $sort: { order: 1 },
        },
      ]);
    }

    // Query for the latest category properties, prioritizing by current city first
    const latestCategory = await propertyCategory.findOne({
      name: { $regex: /latest|newly|recently/i },
      visible: true,
    });

    if (latestCategory) {
      const { days, count } = latestCategory;
      const dateThreshold = new Date();
      dateThreshold.setDate(dateThreshold.getDate() - days);

      let SearchQuery = query
        ? {
            $or: [{ city: { $regex: new RegExp(query), $options: "si" } }],
          }
        : {};

      // Match latest properties by city first
      let latestProperties = await Property.aggregate([
        {
          $match: {
            createdAt: { $gte: dateThreshold },
            propertyApproval: "Resolved",
            isDeleted: false,
            propertyStatus: { $ne: "sold-out" }, // Exclude sold-out properties
            ...SearchQuery,
          },
        },
        {
          $lookup: {
            from: "sellers",
            localField: "postedBy",
            foreignField: "_id",
            as: "postedBy",
          },
        },
        {
          $unwind: "$postedBy",
        },
        {
          $addFields: {
            saved: {
              $in: ["$_id", savedProperties],
            },
          },
        },
        {
          $project: {
            "postedBy.logo": 0,
            "postedBy.profilePic": 0,
          },
        },
        {
          $limit: count, // Limit to 'count' number of latest properties
        },
      ]);

      // If no latest properties match the current city, fallback to other locations
      if (latestProperties.length === 0) {
        latestProperties = await Property.aggregate([
          {
            $match: {
              createdAt: { $gte: dateThreshold },
              propertyApproval: "Resolved",
              isDeleted: false,
              ...SearchQuery,
            },
          },
          {
            $lookup: {
              from: "sellers",
              localField: "postedBy",
              foreignField: "_id",
              as: "postedBy",
            },
          },
          {
            $unwind: "$postedBy",
          },
          {
            $addFields: {
              saved: {
                $in: ["$_id", savedProperties],
              },
            },
          },
          {
            $project: {
              "postedBy.logo": 0,
              "postedBy.profilePic": 0,
            },
          },
          {
            $limit: count,
          },
        ]);
      }

      // Add latest category and properties to the response
      const latestCategoryResponse = {
        _id: latestCategory._id,
        name: latestCategory.name,
        days: latestCategory.days,
        visible: latestCategory.visible,
        description: latestCategory.description,
        order: latestCategory.order,
        count: latestCategory.count,
        propertyCount: latestProperties.length,
        properties: latestProperties,
      };

      // Add latest category to categoriesWithCount
      categoriesWithCount.push(latestCategoryResponse);
    }

    // Sort categoriesWithCount by order field
    categoriesWithCount.sort((a, b) => a.order - b.order);

    // Calculate total counts based on filtered categories
    const totalCounts = categoriesWithCount.length;
    res.status(200).json({
      categories: categoriesWithCount,
      totalCounts: totalCounts,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "An error occurred", error });
  }
};

exports.getAllBlogCategories = async (req, res) => {
  try {
    const categories = await Category.find({}, { _id: 1, category: 1 });
    res.status(200).json({ data: categories });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Something broke' });
  }
};

exports.getAllBlogSubCategories = async (req, res) => {
  try {
    const { categoryId } = req.query;
    let filter = {};
    if (categoryId) {
      filter.categoryId = categoryId;
    }
    const subcategories = await SubCategory.find(filter, { _id: 1, subCategory: 1, categoryId: 1 });
    res.status(200).json({ data: subcategories });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Something broke' });
  }
};

exports.getCities = async (req, res) => {
  try {
    let cities = await Property.distinct("city");

    cities = cities.map((city) => city.toLowerCase());
    cities = cities.filter((city, index, self) => self.indexOf(city) === index);

    return res.status(200).send({ city: cities });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ error: "Something broke" });
  }
};

exports.getTrendingProperties = async (req, res) => {
  try {
    let user = null;
    if (req.user) {
      user = req.user._id;
    }
    let page = parseInt(req.query.page);
    let limit = parseInt(req.query.limit);
    let startIndex = (page - 1) * limit;
    const city = req.query.city || "";

    let cityType = city
      ? {
          city: { $regex: new RegExp(`^${city}`), $options: "si" },
        }
      : {};

    let topProperties = await Property.find({
      $and: [
        cityType,
        // { propertyStatus: "available" },
        { propertyApproval: "Resolved" },
        { isDeleted: false },
        { propertyStatus: { $ne: "sold-out" } }, // Exclude sold-out properties
      ],
    })
      .populate({
        path: "postedBy",
        model: "sellers",
      })
      .sort({ propertyView: -1 })
      .skip(startIndex)
      .limit(5);

    topProperties = await Promise.all(
      topProperties.map(async (property) => {
        if (user) {
          const propertyId = property._id.toString();
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

    return res.status(200).send({
      resStatus: true,
      trendProperties: topProperties,
      message: "Property details fetched successfully!",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ error: "Something broke" });
  }
};

exports.getblogDetails = async (req, res) => {
  try {
    const { blogsId } = req.params;
    if (!blogsId) return validateId(res);

    const blog = await Blogs.findById(blogsId);
    if (!blog) return validateFound(res);

    const data = await Blogs.findById(blogsId)
      .populate({
        path: "categoryId",
        model: "category",
      })
      .populate({
        path: "subCategory",
        model: "subcategory",
      })
      .lean();

    if (!data) return res.status(404).send({ error: "Blog not found" });

    const adminId = data.admin;

    // Fetch the admin data from both sellers and users collections
    const sellerAdmin = await mongoose
      .model("sellers")
      .findById(adminId)
      .lean();
    const userAdmin = await mongoose.model("user").findById(adminId).lean();

    // Assign the correct admin data to the blog document
    if (sellerAdmin) {
      data.admin = sellerAdmin;
    } else if (userAdmin) {
      data.admin = userAdmin;
    } else {
      data.admin = null; // Or handle as needed if admin not found in either collection
    }

    return res.status(200).send({
      res: data,
      success: "Blog details fetched successfully",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ error: "Something broke" });
  }
};

const cron = require("node-cron");

const matchandAddCategory = async () => {
  try {
    const properties = await Property.find();
    const categories = await propertyCategory.find();

    let updatedCount = 0;
    const updatedProperties = await Promise.all(
      properties.map(async (property) => {
        // Skip properties that already have propertyCategory defined
        if (property.propertyCategory && property.propertyCategory.categoryId) {
          return null; // Return null for properties that were not updated
        }

        let updatedProperty = { ...property.toObject() }; // Clone the existing property object

        // Criteria to match and add category
        let updated = false;

        // Check for 'elite' and 'hot' categories
        for (const category of categories) {
          // Check 'elite' category
          if (/elite/i.test(category.name)) {
            const categoryState = category.city.map((c) => c.city);
            const categoryPrice = Number(category.price);
            const propertyPrice = Number(updatedProperty.price);

            if (
              propertyPrice >= categoryPrice &&
              categoryState.includes(updatedProperty.city)
            ) {
              updatedProperty.propertyCategory = {
                categoryId: category._id,
                status: true,
              };
              updated = true;
              break;
            }
          }

          // Check 'hot' category
          if (/(hot|highly)/i.test(category.name)) {
            const shortlistCount = await Saved.countDocuments({
              properties: updatedProperty._id,
              saved: true,
            });
            const categoryShortlistCount = category.shortlistCount;
            const categoryPropertyView = Number(category.propertyView);
            const propertyView = updatedProperty.propertyView;

            if (
              propertyView >= categoryPropertyView &&
              shortlistCount >= categoryShortlistCount
            ) {
              updatedProperty.propertyCategory = {
                categoryId: category._id,
                status: true,
              };
              updated = true;
              break;
            }
          }
        }
        if (updated) {
          await Property.findByIdAndUpdate(property._id, updatedProperty);
          updatedCount++;
          return updatedProperty;
        }

        return null;
      })
    );

    // Filter out null values (properties that were not updated)
    const filteredProperties = updatedProperties.filter(
      (property) => property !== null
    );

    console.log(`Updated ${updatedCount} properties.`); // Log the number of properties updated
  } catch (err) {
    console.error("Error in cron job:", err);
  }
};

const hour = 11;
const minute = 59;

cron.schedule(`${minute} ${hour} * * *`, async () => {
  console.log("Running cron job to update property categories...");
  await matchandAddCategory();
});

const moment = require("moment");
const generateSlots = (from, to) => {
  const startTime = moment("08:00:00", "HH:mm:ss");
  const endTime = moment("22:00:00", "HH:mm:ss");
  const interval = 30; // 30 minutes interval
  const slots = [];
  const userFrom = moment(from, "HH:mm:ss");
  const userTo = moment(to, "HH:mm:ss");

  while (startTime.isBefore(endTime)) {
    const slotTime = startTime.format("HH:mm:ss");
    const isAvailable =
      startTime.isSameOrAfter(userFrom) && startTime.isBefore(userTo);
    slots.push({ slot: slotTime, available: isAvailable });
    startTime.add(interval, "minutes");
  }

  return slots;
};

exports.createSlots = async (req, res) => {
  try {
    const properties = await Property.find({
      $or: [{ from: { $exists: false } }, { to: { $exists: false } }],
    });

    for (const property of properties) {
      if (!property.daysAvailiblity) property.daysAvailiblity = "Everyday";
      if (!property.alldaysAvailable) property.alldaysAvailable = true;
      if (!property.from) property.from = "08:00:00";
      if (!property.to) property.to = "18:00:00";

      const from = property.from;
      const to = property.to;

      const slots = generateSlots(from, to);
      property.slots = slots;

      await property.save();
    }

    return res.status(200).send({
      status: 200,
      message: "Slots created successfully for properties without slots",
    });
  } catch (err) {
    console.log(err);
    return res.status(500).send({ status: 500, message: err.message });
  }
};

exports.addCarousel = async (req, res) => {
  try {
    const {
      title,
      desktopImage,
      mobileImage,
      status,
      propertyId,
      url,
      city,
      caouselExpires,
      bannerTitle,
      bannerType  
    } = req.body;
    const property = await Property.findById(propertyId);
    let reg = new RegExp("^(http|https)://", "i");

    const carousel = {
      title,
      status,
      propertyId: propertyId,
      url: url,
      city: city,
      caouselExpires: caouselExpires,
      bannerType  : bannerType,
      bannerTitle : bannerTitle
    };
    if (desktopImage) {
      if (!reg.test(desktopImage)) {
        const desktopResult = await uploadImage(desktopImage);
        carousel.desktopImage = desktopResult.Location;
      }
    }
    if (mobileImage) {
      if (!reg.test(mobileImage)) {
        const mobileResult = await uploadImage(mobileImage);
        carousel.mobileImage = mobileResult.Location;
      }
    }
    const data = await Carousel.create(carousel);
    return res
      .status(200)
      .send({ message: "Carousel created successfully", data: data });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ error: "Something broke" });
  }
};

exports.updateCarousel = async (req, res) => {
  try {
    const carouselId = req.params.carouselId;
    const carousel = await Carousel.findById(carouselId);
    let reg = new RegExp("^(http|https)://", "i");
    const {
      title,
      desktopImage,
      mobileImage,
      status,
      propertyId,
      url,
      city,
      caouselExpires,
      bannerTitle,
      bannerType
    } = req.body;
    if (title) carousel.title = title;
    if (desktopImage) {
      if (!reg.test(desktopImage)) {
        const desktopResult = await uploadImage(desktopImage);
        carousel.desktopImage = desktopResult.Location;
      }
    }
    if (mobileImage) {
      if (!reg.test(mobileImage)) {
        const mobileResult = await uploadImage(mobileImage);
        carousel.mobileImage = mobileResult.Location;
      }
    }
    if (propertyId) carousel.propertyId = propertyId;
    if (url) carousel.url = url;
    if (status) carousel.status = status;
    if (city) carousel.city = city;
    if (caouselExpires) carousel.caouselExpires = caouselExpires;
    if (bannerTitle) carousel.bannerTitle = bannerTitle;
    if (bannerType) carousel.bannerType = bannerType;
    await carousel.save();
    return res
      .status(200)
      .send({ message: "Carousel updated successfully", data: carousel });
  } catch (err) {
    console.log(err);
    return res.status(500).send({ message: err.message });
  }
};

exports.getCarousels = async (req, res) => {
  try {
    // Retrieve the IP address from the request headers or connection
    const forwardedFor = req.headers["x-forwarded-for"];
    const ip = forwardedFor
      ? forwardedFor.split(",")[0]
      : req.connection.remoteAddress;

    // const ip = "223.181.23.181";
    // const ip='124.253.76.51';

    // Use IPinfo to get geolocation data for the user's IP
    const { data: ipInfo } = await axios.get(
      `https://ipinfo.io/${ip}?token=4f0190a299c9e7`
    );
    const currentCity = ipInfo?.city || "Unknown City";
    //const newCity = currentCity;
    const newCity = currentCity;
    console.log("Current City:", currentCity);
  
    let carousels = await Carousel.find({ city: newCity }).populate({
      path: "propertyId",
      model: "properties",
      select: "_id propertyTitle propertyCode",
      match: { propertyStatus: { $ne: "sold-out" } }, // Exclude sold-out properties
    }).sort({createdAt: -1});

    // if(carousels.length === 0){
    //   carousels = await Carousel.find()
    //   .populate({
    //     path : "propertyId",
    //     model : "properties",
    //     select: "_id propertyTitle propertyCode"
    //   })
    //   .sort({createdAt: -1})
    //   .limit(5);
    // }
    return res
      .status(200)
      .send({ message: "Carousels fetched successfully", data: carousels, currentCity : newCity });
  } catch (err) {
    console.log(err);
    return res.status(500).send({ message: err.message });
  }
};

// exports.getAdminCarousels = async (req, res) => {
//   try {
//     const carousels = await Carousel.find().populate({
//       path: "propertyId",
//       model: "properties",
//       select: "_id propertyTitle propertyCode",
//     });
//     return res
//       .status(200)
//       .send({ message: "Carousels fetched successfully", data: carousels });
//   } catch (err) {
//     console.log(err);
//     return res.status(500).send({ message: err.message });
//   }
// };

exports.getAdminCarousels = async (req, res) => {
  try {
    const carousels = await Carousel.find().populate({
      path: "propertyId",
      model: "properties",
      //select: "_id propertyTitle propertyCode",
    });
    const carouselIds = carousels.map((carousel) => carousel._id);
    const bannerClicks = await BannerClick.aggregate([
      {
        $match: { bannerId: { $in: carouselIds } },
      },
      {
        $group: {
          _id: "$bannerId",
          count: { $sum: 1 },
        },
      },
    ]);

    const carouselsWithClicks = carousels.map((carousel) => {
      const clickData = bannerClicks.find(
        (click) => String(click._id) === String(carousel._id)
      );
      return {
        ...carousel._doc,
        bannerClicks: clickData ? clickData.count : 0,
      };
    });

    return res.status(200).send({
      message: "Carousels fetched successfully",
      data: carouselsWithClicks,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).send({ message: err.message });
  }
};

exports.deleteCarousel = async (req, res) => {
  try {
    const carouselId = req.params.carouselId;
    const carousel = await Carousel.findByIdAndDelete(carouselId);
    return res
      .status(200)
      .send({ message: "Carousel deleted successfully", data: carousel });
  } catch (err) {
    console.log(err);
    return res.status(500).send({ message: err.message });
  }
};

exports.getLocationCarousel = async (req, res) => {
  try {
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
    let propertiesInCity = await Property.find({ 
      city: cityRegex,
      propertyStatus: { $ne: "sold-out" }, // Exclude sold-out properties
    }).select(
      "_id propertyTitle propertyCode city"
    );

    // Extract property IDs
    const propertyIds = propertiesInCity.map((property) => property._id);

    // Find carousels that match the property IDs
    let carousels = await Carousel.find({ propertyId: { $in: propertyIds } })
      .populate({
        path: "propertyId",
        model: "properties",
        select: "propertyTitle propertyCode city",
      })
      .select("_id title desktopImage mobileImage status");

    // If no carousels are found in the user's city, fetch the latest added carousel
    if (carousels.length === 0) {
      carousels = await Carousel.find({})
        .sort({ createdAt: -1 })
        .limit(10)
        .populate({
          path: "propertyId",
          model: "properties",
          select: "propertyTitle propertyCode city",
        })
        .select("_id title desktopImage mobileImage status");
    }

    return res
      .status(200)
      .send({ message: "Carousels fetched successfully", data: carousels });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ error: "Something broke" });
  }
};

exports.getBlogsByCategory = async (req, res) => {
  try {
    const { categoryId } = req.query;
    if (!categoryId) return res.status(400).json({ error: "categoryId is required" });
    const blogs = await Blogs.find({ categoryId, status: "publish" })
      .populate("categoryId")
      .populate("subCategory")
      .lean();
    res.status(200).json({ data: blogs });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Something broke" });
  }
};

exports.getBlogsBySubCategory = async (req, res) => {
  try {
    const { subCategoryId } = req.query;
    if (!subCategoryId) return res.status(400).json({ error: "subCategoryId is required" });
    const blogs = await Blogs.find({ subCategory: subCategoryId, status: "publish" })
      .populate("categoryId")
      .populate("subCategory")
      .lean();
    res.status(200).json({ data: blogs });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Something broke" });
  }
};

// Homepage stats API
exports.getHomepageStats = async (req, res) => {
  console.log("getHomepageStats.............................................");
  try {
    // Total properties (published and approved)
    const totalProperties = await Property.countDocuments({ status: 'publish', propertyApproval: 'Resolved' });
    // Total developers
    const totalDevelopers = await Seller.countDocuments({ i_am: 'developer' });
    // Total inquiries
    const totalInquiries = await Enquiry.countDocuments();
    // Total leaders onboarded
    const totalSoldOutProperties = await Property.countDocuments({ propertyStatus: 'sold-out' });

    console.log('Homepage Stats:');
    console.log('Properties -', totalProperties);
    console.log('Developers -', totalDevelopers);
    console.log('Inquiries-', totalInquiries);
    console.log('Sold Out Properties-soldOutProperties', totalSoldOutProperties);

    return res.status(200).json({
      properties: totalProperties,
      developers: totalDevelopers,
      inquiries: totalInquiries,
      leadersOnboarded: totalSoldOutProperties,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to fetch homepage stats' });
  }
};
