const Seller = require("../model/seller.model");

exports.developerAnalytics = async (req, res) => {
  try {
    const { period, startDate, endDate, query = "" } = req.query;
    let dateFilter = null;
    let days = 0;
    if (period) {
      if (period === "7") days = 7;
      else if (period === "15") days = 15;
      else if (period === "30") days = 30;

      if (days > 0) {
        const calculatedStartDate = new Date();
        calculatedStartDate.setDate(calculatedStartDate.getDate() - days);
        dateFilter = { $gte: calculatedStartDate };
      }
    }

    // Handle custom date range
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
            { fullName: { $regex: new RegExp(query), $options: "si" } },
            { email: { $regex: new RegExp(query), $options: "si" } },
          ],
        }
      : {};

    if (dateFilter) {
      searchQuery.createdAt = dateFilter;
    }
    let page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 10;
    let startIndex = (page - 1) * limit;

    const [allDevelopers, allDevelopersCount] = await Promise.all([
      Seller.find({ interested: "sell", ...searchQuery })
        .select("fullName companyName email createdAt phone")
        .sort({ createdAt: -1 })
        .skip(startIndex)
        .limit(limit),
      Seller.countDocuments({ interested: "sell", ...searchQuery }),
    ]);

    const [profileCompleted, profileCompletedCount] = await Promise.all([
      Seller.find({
        interested: "sell",
        profileCompleted: true,
        ...searchQuery,
      })
        .select("fullName companyName email createdAt phone")
        .sort({ createdAt: -1 })
        .skip(startIndex)
        .limit(limit),
      Seller.countDocuments({
        interested: "sell",
        profileCompleted: true,
        ...searchQuery,
      }),
    ]);

    const [pendingProfile, pendingProfileCount] = await Promise.all([
      Seller.find({
        interested: "sell",
        profileCompleted: { $in: [false, null] },
        ...searchQuery,
      })

        .select("fullName companyName email createdAt phone")
        .sort({ createdAt: -1 })
        .skip(startIndex)
        .limit(limit),
      Seller.countDocuments({
        interested: "sell",
        profileCompleted: { $in: [false, null] },
        ...searchQuery,
      }),
    ]);

    return res.status(200).send({
      developers: {
        data: allDevelopers,
        count: allDevelopersCount,
      },
      profileCompleted: {
        data: profileCompleted,
        count: profileCompletedCount,
      },
      pendingProfile: {
        data: pendingProfile,
        count: pendingProfileCount,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Expects: [{ _id: "devId1", featuredOrder: 1 }, { _id: "devId2", featuredOrder: 2 }, ...]
exports.updateFeaturedOrder = async (req, res) => {
  console.log(req,"developerAnalytics.............................................");

  try {
    const { orderUpdates } = req.body; // array of {_id, featuredOrder}
    if (!Array.isArray(orderUpdates)) {
      return res.status(400).json({ error: "orderUpdates must be an array" });
    }

    const bulkOps = orderUpdates.map(dev => ({
      updateOne: {
        filter: { _id: dev._id },
        update: { $set: { featuredOrder: dev.featuredOrder } }
      }
    }));

    const result = await require("../model/seller.model").bulkWrite(bulkOps);

    console.log("BulkWrite result:", result);

    res.status(200).json({ success: true, message: "Featured order updated" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to update featured order" });
  }
};

exports.autoAssignFeaturedOrder = async (req, res) => {
  try {
    console.log("enter autoAssignFeaturedOrder.............................................");
    // 1. Find all featured developers, sorted by creation date
    const featuredDevs = await Seller.find({ featured: true }).sort({ createdAt: 1 });

    // 2. Prepare bulk update operations
    const bulkOps = featuredDevs.map((dev, idx) => ({
      updateOne: {
        filter: { _id: dev._id },
        update: { $set: { featuredOrder: idx + 1 } }
      }
    }));

    // 3. Execute the bulk update
    if (bulkOps.length > 0) {
      await Seller.bulkWrite(bulkOps);
    }

    res.status(200).json({ success: true, message: "Featured order assigned based on creation date." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to auto-assign featured order." });
  }
};