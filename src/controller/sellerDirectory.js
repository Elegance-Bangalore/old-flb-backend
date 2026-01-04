const Seller = require("../model/seller.model");
const Property = require("../model/property.model");
const {
  idNotFoundError,
  validateId,
  validateFields,
  validateFound,
} = require("../utils/commonValidations");
// aws Config
const AWS = require("aws-sdk");
const { Console, count } = require("console");

const awsConfig = {
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
  apiVersion: process.env.AWS_API_VERSION,
};
const S3 = new AWS.S3(awsConfig);

exports.markSellerFeatured = async (req, res) => {
  try {
    const sellerId = req.params.sellerId;
    console.log("[markSellerFeatured] sellerId:", sellerId);
    const seller = await Seller.findById(sellerId);
    if (!seller) {
      console.log("[markSellerFeatured] Seller not found");
      return res.status(404).send({ error: "Seller not found" });
    }
    console.log(`[markSellerFeatured] Current featured: ${seller.featured}, featuredOrder: ${seller.featuredOrder}`);
    // if (seller.about.trim() === "") {
    //   console.log("[markSellerFeatured] Seller missing 'about' section");
    //   return res.status(400).send({
    //     error: "Seller cannot be marked as featured without a valid 'about' section.",
    //   });
    // }

    if (!seller.featured) {
      // Marking as featured: set featuredOrder to max+1
      const maxOrderDoc = await Seller.findOne({ featured: true, featuredOrder: { $gt: 0 } }).sort({ featuredOrder: -1 });
      const newOrder = maxOrderDoc && maxOrderDoc.featuredOrder ? maxOrderDoc.featuredOrder + 1 : 1;
      seller.featuredOrder = newOrder;
      seller.featured = true;
      console.log(`[markSellerFeatured] Marking as featured. Assigned featuredOrder: ${newOrder}`);
    } else {
      // Unmarking as featured: set featuredOrder to 0 and shift down others
      const oldOrder = seller.featuredOrder;
      seller.featured = false;
      seller.featuredOrder = 0;
      console.log(`[markSellerFeatured] Unmarking as featured. Old featuredOrder: ${oldOrder}`);
      // Shift down all with higher order
      const updateResult = await Seller.updateMany(
        { featured: true, featuredOrder: { $gt: oldOrder } },
        { $inc: { featuredOrder: -1 } }
      );
      console.log(`[markSellerFeatured] Shifted down featuredOrder for others. updateMany result:`, updateResult);
    }
    await seller.save();
    console.log(`[markSellerFeatured] Seller saved. New featured: ${seller.featured}, featuredOrder: ${seller.featuredOrder}`);
    return res.status(200).send({
      message: `Seller Mark Featured ${seller.featured}`,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).send({ error: "Something broke" });
  }
};

exports.getFeaturedSellers = async (req, res) => {
  try {
    let page = parseInt(req.query.page);
    let limit = parseInt(req.query.limit);
    let startIndex = (page - 1) * limit;
    const developers = await Seller.find({ featured: true })
      .sort({ featuredOrder: 1 })
      .skip(startIndex)
      .limit(limit);

    const count = await Seller.countDocuments({ featured: true });
    const developersWithProjects = await Promise.all(
      developers.map(async (developer) => {
        const ongoingProjects = await Property.countDocuments({
          postedBy: developer._id,
          status: "publish",
          propertyStatus: { $ne: "sold-out" },
        });

        // Fetch all properties posted by the developer
        const properties = await Property.find({
          postedBy: developer._id,
          status: "publish",
          propertyApproval: "Resolved",
          propertyStatus: { $ne: "sold-out" },
        })
          .select("_id propertyTitle propertyCode propertyType")
          .limit(3)
          .lean();

        const {
          profilePic,
          password,
          completedProjects,
          subscriptionId,
          isEmailVerified,
          verificationToken,
          verificationTokenExpiresAt,
          tokenVerified,
          profileCompleted,
          notification,
          alternateNumber,
          isActive,
          phoneOtp,
          isAccountVerified,
          count,
          ...developerData
        } = developer.toObject();

        return {
          ...developerData,
          ongoingProjects,
          properties,
        };
      })
    );
    return res.status(200).send({
      message: "Developers fetched Successfully",
      developers: developersWithProjects,
      count: count,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).send({ error: "Something broke" });
  }
};

// exports.getSellerDirectory = async (req, res) => {
//   try {
//     let page = parseInt(req.query.page);
//     let limit = parseInt(req.query.limit);
//     let startIndex = (page - 1) * limit;

//     const developers = await Seller.find({
//       companyName: { $regex: /^[a-zA-Z0-9]/, $options: "i" },
//     })
//       .collation({ locale: "en", strength: 2 })
//       .sort({ companyName: 1 })
//       .skip(startIndex)
//       .limit(limit)
//       .select("_id companyName fullName")
//       .lean();

//     const count = await Seller.countDocuments({
//       companyName: { $regex: /^[a-zA-Z0-9]/, $options: "i" },
//     });
//     const groupedDevelopers = developers.reduce((acc, developer) => {
//       const firstChar = developer.companyName.charAt(0).toUpperCase();
//       if (!acc[firstChar]) {
//         acc[firstChar] = [];
//       }
//       acc[firstChar].push(developer);
//       return acc;
//     }, {});

//     const sortedGroupedDevelopers = Object.keys(groupedDevelopers)
//       .sort((a, b) => {
//         return a.localeCompare(b, undefined, { numeric: true });
//       })
//       .reduce((acc, key) => {
//         acc[key] = groupedDevelopers[key];
//         return acc;
//       }, {});

//     return res.status(200).send({
//       message: "Sellers fetched successfully",
//       developers: sortedGroupedDevelopers,
//       count: count,
//     });
//   } catch (error) {
//     console.error(error);
//     return res.status(500).send({ error: "Something broke" });
//   }
// };

exports.getSellerDirectory = async (req, res) => {
  try {
    let page = parseInt(req.query.page);
    let limit = parseInt(req.query.limit);
    let startIndex = (page - 1) * limit;

    const search = req.query.search || "";

    // Create search filter
    const searchFilter = search
      ? {
          $or: [
            { companyName: { $regex: search, $options: "i" } },
            { fullName: { $regex: search, $options: "i" } },
          ],
        }
      : { companyName: { $regex: /^[a-zA-Z0-9]/, $options: "i" } };

    const developers = await Seller.find({i_am : "developer", ...searchFilter})
      .collation({ locale: "en", strength: 2 })
      .sort({ companyName: 1 })
      .skip(startIndex)
      .limit(limit)
      .select("_id companyName fullName")
      .lean();

    const count = await Seller.countDocuments({i_am : "developer", ...searchFilter});

    const groupedDevelopers = developers.reduce((acc, developer) => {
      const firstChar = developer.companyName.charAt(0).toUpperCase();
      const groupKey = /[0-9]/.test(firstChar) ? '0-9' : firstChar;

      if (!acc[groupKey]) {
        acc[groupKey] = [];
      }
      acc[groupKey].push(developer);
      return acc;
    }, {});

    const sortedGroupedDevelopers = Object.keys(groupedDevelopers)
      .sort((a, b) => {
        if (a === '0-9') return -1;
        if (b === '0-9') return 1;
        return a.localeCompare(b, undefined, { numeric: true });
      })
      .reduce((acc, key) => {
        acc[key] = groupedDevelopers[key];
        return acc;
      }, {});

    return res.status(200).send({
      message: "Sellers fetched successfully",
      developers: sortedGroupedDevelopers,
      count: count,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).send({ error: "Something broke" });
  }
};

exports.uploadMultipleFiles = async function (req, res) {
  try {
    const files = req.files;
    if (!files || files.length === 0) {
      throw new Error('No files uploaded');
    }

    const uploadResults = [];

    for (const file of files) {
      const mimeType = file.mimetype;
      const binaryData = file.buffer;
      const originalName = file.originalname.replace(/\s/g, ""); // Get the original file name and remove any spaces

      // Set S3 upload parameters
      const params = {
        Bucket: "flb-public",
        Key: `${originalName}`, // Append a unique identifier to the original file name to avoid collisions
        Body: binaryData,
        ContentType: mimeType,
      };

      const s3upload = await S3.upload(params).promise();
      uploadResults.push(s3upload);
    }

    res.status(200).json(uploadResults);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: `Upload failed: ${err.message}` });
  }
};