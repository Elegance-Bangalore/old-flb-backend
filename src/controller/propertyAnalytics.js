const Property = require("../model/property.model");
const Saved = require("../model/buyerSaved");
const Message = require("../model/message.model");
const Visit = require("../model/savedProperties");
const Inquiry = require("../model/enquiry.model");
const sellerModel = require("../model/seller.model");
const PropertyViews = require("../model/propertyViews");
const mongoose = require("mongoose");

// exports.getPropertyAnalytics = async (req, res) => {
//   try {
//     const { period, startDate, endDate } = req.query;
//     let dateFilter = null;

//     if (period) {
//       let days = 0;

//       if (period === "7") days = 7;
//       else if (period === "15") days = 15;
//       else if (period === "30") days = 30;

//       if (days > 0) {
//         const calculatedStartDate = new Date();
//         calculatedStartDate.setDate(calculatedStartDate.getDate() - days);
//         dateFilter = { $gte: calculatedStartDate };
//       }
//     }

//     // Handle custom date range
//     if (period === "custom" && startDate && endDate) {
//       const customStartDate = new Date(startDate);
//       const customEndDate = new Date(endDate);
//       customEndDate.setHours(23, 59, 59, 999); 

//       if (!isNaN(customStartDate) && !isNaN(customEndDate)) {
//         dateFilter = { $gte: customStartDate, $lte: customEndDate };
//       }
//     }

//     let page = parseInt(req.query.page);
//     let limit = parseInt(req.query.limit);
//     let startIndex = (page - 1) * limit;
//     let endIndex = page * limit;

//     const result = {};

//     const query = req.query.query || "";

//     let searchQuery = query
//       ? {
//           $or: [
//             {
//               propertyType: { $regex: new RegExp(`^${query}`), $options: "si" },
//             },
//             { propertyTitle: { $regex: new RegExp(query), $options: "si" } },
//             { city: { $regex: new RegExp(`^${query}`), $options: "si" } },
//             { locality: { $regex: new RegExp(`^${query}`), $options: "si" } },
//           ],
//         }
//       : {};

//       if (dateFilter) {
//         searchQuery.createdAt = dateFilter;
//       }

//     if (query) {
//       const sellers = await sellerModel
//         .find({
//           companyName: { $regex: new RegExp(`^${query}`), $options: "si" },
//         })
//         .select("_id");
//       const sellerIds = sellers.map((seller) => seller._id);
//       searchQuery.$or.push({ postedBy: { $in: sellerIds } });
//     }

//     const totalPropertiesCount = await Property.countDocuments(searchQuery).exec();

//     if (endIndex < totalPropertiesCount) {
//       result.next = {
//         page: page + 1,
//         limit: limit,
//       };
//     }

//     if (startIndex > 0) {
//       result.previous = {
//         page: page - 1,
//         limit: limit,
//       };
//     }

//     const order = req.query.order || "";
//     const sort = req.query.sort || "";

//     let sortOrder = {};
//     if (order === "ascending") {
//       sortOrder = { [sort]: 1 };
//     } else if (order === "descending") {
//       sortOrder = { [sort]: -1 };
//     } else {
//       sortOrder = { createdAt: -1 };
//     }

//     const pagination =
//       page && limit ? [{ $skip: startIndex }, { $limit: parseInt(limit) }] : [];

//     const propertyAnalytics = await Property.aggregate([
//       { $match: searchQuery },
//       {
//         $lookup: {
//           from: "propertyviews",
//           localField: "_id",
//           foreignField: "propertyId",
//           as: "propertyViews",
//         },
//       },
//       {
//         $lookup: {
//           from: "saveds",
//           localField: "_id",
//           foreignField: "properties",
//           as: "saved",
//         },
//       },
//       {
//         $lookup: {
//           from: "visitrequests",
//           localField: "_id",
//           foreignField: "properties",
//           as: "visitRequests",
//         },
//       },
//       {
//         $lookup: {
//           from: "inquiries",
//           localField: "_id",
//           foreignField: "propertyId",
//           as: "inquiries",
//         },
//       },
//       {
//         $lookup: {
//           from: "messages",
//           localField: "_id",
//           foreignField: "propertyId",
//           as: "messages",
//         },
//       },
//       {
//         $addFields: {
//           messageSenders: {
//             $filter: {
//               input: "$messages",
//               as: "message",
//               cond: {
//                 $and: [
//                   { $ne: ["$$message.senderId", "$postedBy"] },
//                   dateFilter ? { $gte: ["$$message.createdAt", dateFilter.$gte] } : {},
//                 ],
//               },
//             },
//           },
//           shortlistedCount: {
//             $size: {
//               $filter: {
//                 input: "$saved",
//                 as: "saved",
//                 cond: dateFilter
//                   ? {
//                       $and: [
//                         { $gte: ["$$saved.createdAt", dateFilter.$gte] },
//                         dateFilter?.$lte ? { $lte: ["$$saved.createdAt", dateFilter.$lte] } : {},
//                       ],
//                     }
//                   : true,
//               },
//             },
//           },
//           visitedCount: {
//             $size: {
//               $filter: {
//                 input: "$visitRequests",
//                 as: "visitRequest",
//                 cond: dateFilter
//                   ? {
//                       $and: [
//                         { $gte: ["$$visitRequest.createdAt", dateFilter.$gte] },
//                         dateFilter?.$lte ? { $lte: ["$$visitRequest.createdAt", dateFilter.$lte] } : {},
//                       ],
//                     }
//                   : true,
//               },
//             },
//           },
//           propertyViewCount: {
//             $size: {
//               $filter: {
//                 input: "$propertyViews",
//                 as: "propertyView",
//                 cond: dateFilter
//                   ? {
//                       $and: [
//                         { $gte: ["$$propertyView.createdAt", dateFilter.$gte] },
//                         dateFilter?.$lte ? { $lte: ["$$propertyView.createdAt", dateFilter.$lte] } : {},
//                       ],
//                     }
//                   : true,
//               },
//             },
//           },
//         },
//       },
//       {
//         $project: {
//           _id: 1,
//           propertyTitle: 1,
//           propertyCode: 1,
//           propertyType: 1,
//           propertyStatus: 1,
//           shortlistedCount: 1,
//           visitedCount: 1,
//           inquiriesCount: {
//             $size: {
//               $filter: {
//                 input: "$inquiries",
//                 as: "inquiry",
//                 cond: dateFilter
//                   ? {
//                       $and: [
//                         { $gte: ["$$inquiry.createdAt", dateFilter.$gte] },
//                         dateFilter?.$lte ? { $lte: ["$$inquiry.createdAt", dateFilter.$lte] } : {},
//                       ],
//                     }
//                   : true,
//               },
//             },
//           },
//           chatsCount: {
//             $size: {
//               $setUnion: {
//                 $map: {
//                   input: "$messageSenders",
//                   as: "sender",
//                   in: "$$sender.senderId",
//                 },
//               },
//             },
//           },
//           propertyViewCount: 1,
//         },
//       },
//       { $sort: sortOrder },
//       ...pagination,
//     ]);

//     const totalPropertyViews = await PropertyViews.countDocuments(
//       dateFilter ? { createdAt: dateFilter } : {}
//     ).exec();

//     const totalShortlistedProperties = await Saved.countDocuments(
//       dateFilter ? { createdAt: dateFilter } : {}
//     ).exec();

//     const totalVisitedProperties = await Visit.countDocuments(
//       dateFilter ? { createdAt: dateFilter } : {}
//     ).exec();

//     const totalInquiries = await Inquiry.countDocuments(
//       dateFilter ? { createdAt: dateFilter } : {}
//     ).exec();

//     res.status(200).send({
//       totalPropertyViews: totalPropertyViews,
//       totalShortlisted: totalShortlistedProperties,
//       totalVisited: totalVisitedProperties,
//       totalInquiries: totalInquiries,
//       propertyAnalytics: propertyAnalytics,
//       totalProperties: totalPropertiesCount,
//     });
//   } catch (error) {
//     console.log(error);
//     res.status(500).send({ error: "Internal Server Error" });
//   }
// };

exports.getPropertyAnalytics = async (req, res) => {
  try {
    const { period, startDate, endDate, page, limit, query, order, sort } = req.query;
    let dateFilter = null;

    // Set up date filter
    if (period) {
      let days = parseInt(period);

      if (!isNaN(days)) {
        const calculatedStartDate = new Date();
        calculatedStartDate.setDate(calculatedStartDate.getDate() - days);
        dateFilter = { $gte: calculatedStartDate };
      }
    }

    if (period === "custom" && startDate && endDate) {
      const customStartDate = new Date(startDate);
      const customEndDate = new Date(endDate);
      customEndDate.setHours(23, 59, 59, 999);

      if (!isNaN(customStartDate) && !isNaN(customEndDate)) {
        dateFilter = { $gte: customStartDate, $lte: customEndDate };
      }
    }

    const searchQuery = query
      ? {
          $or: [
            { propertyType: { $regex: new RegExp(`^${query}`), $options: "si" } },
            { propertyTitle: { $regex: new RegExp(query), $options: "si" } },
            { city: { $regex: new RegExp(`^${query}`), $options: "si" } },
            { locality: { $regex: new RegExp(`^${query}`), $options: "si" } },
          ],
        }
      : {};

    const sellers = query
      ? await sellerModel
          .find({ companyName: { $regex: new RegExp(`^${query}`), $options: "si" } })
          .select("_id")
      : [];

    if (sellers.length) {
      const sellerIds = sellers.map((seller) => seller._id);
      searchQuery.$or.push({ postedBy: { $in: sellerIds } });
    }

    const totalPropertiesCount = await Property.countDocuments(searchQuery).exec();

    // Pagination and sorting setup
    const pageNum = parseInt(page) || 1;
    const pageLimit = parseInt(limit) || 10;
    const startIndex = (pageNum - 1) * pageLimit;
    const sortOrder = order === "ascending" ? { [sort || "createdAt"]: 1 } : { [sort || "createdAt"]: -1 };

    const propertyAnalytics = await Property.aggregate([
      { $match: searchQuery },
      {
        $lookup: {
          from: "propertyviews",
          localField: "_id",
          foreignField: "propertyId",
          as: "propertyViews",
        },
      },
      {
        $lookup: {
          from: "saveds",
          localField: "_id",
          foreignField: "properties",
          as: "saved",
        },
      },
      {
        $lookup: {
          from: "visitrequests",
          localField: "_id",
          foreignField: "properties",
          as: "visitRequests",
        },
      },
      {
        $lookup: {
          from: "inquiries",
          localField: "_id",
          foreignField: "propertyId",
          as: "inquiries",
        },
      },
      {
        $addFields: {
          shortlistedCount: {
            $size: {
              $filter: {
                input: "$saved",
                as: "saved",
                cond: dateFilter
                  ? {
                      $and: [
                        { $gte: ["$$saved.createdAt", dateFilter.$gte] },
                        dateFilter.$lte ? { $lte: ["$$saved.createdAt", dateFilter.$lte] } : {},
                      ],
                    }
                  : true,
              },
            },
          },
          visitedCount: {
            $size: {
              $filter: {
                input: "$visitRequests",
                as: "visitRequest",
                cond: dateFilter
                  ? {
                      $and: [
                        { $gte: ["$$visitRequest.createdAt", dateFilter.$gte] },
                        dateFilter.$lte ? { $lte: ["$$visitRequest.createdAt", dateFilter.$lte] } : {},
                      ],
                    }
                  : true,
              },
            },
          },
          inquiriesCount: {
            $size: {
              $filter: {
                input: "$inquiries",
                as: "inquiry",
                cond: dateFilter
                  ? {
                      $and: [
                        { $gte: ["$$inquiry.createdAt", dateFilter.$gte] },
                        dateFilter.$lte ? { $lte: ["$$inquiry.createdAt", dateFilter.$lte] } : {},
                      ],
                    }
                  : true,
              },
            },
          },
          propertyViewCount: {
            $size: {
              $filter: {
                input: "$propertyViews",
                as: "propertyView",
                cond: dateFilter
                  ? {
                      $and: [
                        { $gte: ["$$propertyView.createdAt", dateFilter.$gte] },
                        dateFilter.$lte ? { $lte: ["$$propertyView.createdAt", dateFilter.$lte] } : {},
                      ],
                    }
                  : true,
              },
            },
          },
        },
      },
      {
        $project: {
          _id: 1,
          propertyTitle: 1,
          propertyCode: 1,
          propertyType: 1,
          propertyStatus: 1,
          shortlistedCount: 1,
          visitedCount: 1,
          inquiriesCount: 1,
          propertyViewCount: 1,
        },
      },
      { $sort: sortOrder },
      { $skip: startIndex },
      { $limit: pageLimit },
    ]);

    const totalPropertyViews = await PropertyViews.countDocuments(dateFilter ? { createdAt: dateFilter } : {}).exec();
    const totalShortlistedProperties = await Saved.countDocuments(dateFilter ? { createdAt: dateFilter } : {}).exec();
    const totalVisitedProperties = await Visit.countDocuments(dateFilter ? { createdAt: dateFilter } : {}).exec();
    const totalInquiries = await Inquiry.countDocuments(dateFilter ? { createdAt: dateFilter } : {}).exec();

    res.status(200).send({
      totalPropertyViews,
      totalShortlisted: totalShortlistedProperties,
      totalVisited: totalVisitedProperties,
      totalInquiries,
      propertyAnalytics,
      totalProperties: totalPropertiesCount,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({ error: "Internal Server Error" });
  }
};
