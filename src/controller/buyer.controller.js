const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const buyerwizardModel = require("./../model/buyerwizard.model");
const sellerModel = require("../model/seller.model");
const Property = require("../model/property.model");
const { isValidObjectId } = mongoose;
const bookingSlotModel = require("../model/bookingSlot.model");
const { validationResult } = require("express-validator");
const sellerSubModel = require("../model/sellerSub.model");
const propertyModel = require("../model/property.model");
const enquiryModel = require("../model/enquiry.model");
const usersModel = require("../model/users.model.js");
const Requests = require("../model/savedProperties");
const Saved = require("../model/buyerSaved");
const moment = require("moment");
const sendEmailSign = require("../utils/emailSend.js");
const sendEmailUsers = require("../utils/emailMultiple.js");
const Blogs = require("../model/blogs");

exports.buyersInterest = async (req, res) => {
  try {
    let { _id } = req.user;
    let {
      plotSize,
      budgerRange,
      city,
      location,
      specificAreaOfInterest,
      propertyType,
      amenities,
    } = req.body;
    const dataToUpdate = {
      plotSize: plotSize ? plotSize : "",
      budgerRange: budgerRange ? budgerRange : "",
      city: city ? city : "",
      location: location ? location : "",
      specificAreaOfInterest: specificAreaOfInterest
        ? specificAreaOfInterest
        : "",
      propertyType: propertyType ? propertyType : "",
      amenities: amenities.length ? amenities : [],
    };
    let buyerDataToUpdate = await buyerwizardModel.findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(_id) },
      { $set: { ...dataToUpdate } },
      { upsert: true },
      { new: true }
    );
    if (buyerDataToUpdate) {
      return res.send({
        status: 200,
        message: "Buyer interests added",
        data: buyerDataToUpdate,
      });
    }
    return res.send({
      status: 422,
      message: "Failed to add the buyer interest",
    });
  } catch (err) {
    return res.status(500).send({ status: 500, message: err.message });
  }
};

exports.bookSlot = async (req, res) => {
  try {
    const { fullName, phone } = req.user;

    const { propertyCode, sellerId, scheduledTime } = req.body;
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.send({ status: 422, errors: errors.array() });
    }
    const dataToUpdate = {
      buyerName: fullName,
      buyerPhone: phone,
      propertyCode: propertyCode,
      sellerId: sellerId,
      scheduledDateTime: scheduledTime,
    };

    const pushDataToDB = await bookingSlotModel.create({ ...dataToUpdate });
    if (pushDataToDB) {
      return res.send({
        status: 200,
        message: "Meeting request raised successfully",
        data: pushDataToDB,
      });
    } else {
      return res.send({
        status: 200,
        message: "Failed to raised request",
        data: [],
      });
    }
  } catch (err) {
    return res.status(500).send({ status: 500, message: err.message });
  }
};

// update a booked slot
exports.updateSlot = async (req, res) => {
  try {
    let { propertyCode, sellerId, scheduledTime, bookingId } = req.body;

    let dataToUpdate = {};
    if (propertyCode !== undefined && propertyCode !== "") {
      dataToUpdate = {
        ...dataToUpdate,
        propertyCode: propertyCode,
      };
    }
    if (sellerId !== undefined && sellerId !== "") {
      dataToUpdate = {
        ...dataToUpdate,
        sellerId: sellerId,
      };
    }
    if (scheduledTime !== undefined && scheduledTime !== "") {
      dataToUpdate = {
        ...dataToUpdate,
        scheduledDateTime: scheduledTime,
      };
    }

    const pushDataToDB = await bookingSlotModel.findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(bookingId) },
      { $set: { ...dataToUpdate } },
      { new: true }
    );
    if (pushDataToDB) {
      return res.send({
        status: 200,
        message: "Meeting request updated successfully",
        data: pushDataToDB,
      });
    } else {
      return res.send({
        status: 200,
        message: "Failed to update request",
        data: [],
      });
    }
  } catch (err) {
    return res.status(500).send({ status: 500, message: err.message });
  }
};

// delete a booked slot
exports.deleteSlot = async (req, res) => {
  try {
    const { bookingId } = req.body;

    const pushDataToDB = await bookingSlotModel.findOneAndDelete({
      _id: new mongoose.Types.ObjectId(bookingId),
    });
    if (pushDataToDB) {
      return res.send({
        status: 200,
        message: "Meeting request deleted successfully",
        data: pushDataToDB,
      });
    } else {
      return res.send({
        status: 200,
        message: "Failed to deleted request",
      });
    }
  } catch (err) {
    return res.status(500).send({ status: 500, message: err.message });
  }
};

// property listing as per plan and its expiry
exports.propertyPlan = async (req, res) => {
  try {
    let plan = req.query.plan;

    let propertyData = await sellerSubModel.aggregate([
      { $match: { plan: plan } },
      { $project: { expiresAt: 1, id: 1, _id: 0 } },
      { $addFields: { plan: plan } },
      {
        $lookup: {
          from: "properties",
          let: { idd: "$id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ["$postedBy", "$$idd"],
                },
              },
            },
            {
              $project: {
                _id: 0,
                propertyCode: 1,
                propertyType: 1,
                propertyTitle: 1,
              },
            },
          ],
          as: "properties",
        },
      },
      { $unwind: "$properties" },
    ]);
    return res.send({
      status: 200,
      message: "Plan & subscription of property",
      data: propertyData,
    });
  } catch (err) {
    return res.status(500).send({ status: 500, message: err.message });
  }
};

// // post inquiry
// exports.postInquiry = async (req, res) => {
//   try {
//     const {
//       buyerName,
//       buyerPhone,
//       propertyTitle,
//       buyerEmail,
//       propertyCode,
//       propertyId,
//     } = req.body;

//     // let ifBuyerExists = await sellerModel.findOne({ email: buyerEmail }).lean();
//     // if (!ifBuyerExists) {
//     //   return res
//     //     .status(404)
//     //     .json({ error: "User does not exist, please register" });
//     // }
//     let dataToCreate = {
//       propertyId: propertyId,
//       // buyerId: ifBuyerExists._id,
//       buyerName: buyerName,
//       buyerPhone: buyerPhone,
//       propertyTitle: propertyTitle,
//       buyerEmail: buyerEmail,
//       propertyCode: propertyCode,
//     };
//     if (req.user && req.user?._id) {
//       dataToCreate = {
//         ...dataToCreate,
//         buyerId: req.user._id,
//       };
//     }

//     const property = await Property.findById(propertyId);
//     const seller = await sellerModel.findById(property.postedBy);

//     const emailTemplate = "inquiry";
//     const subject = "Inquiry for Property";
//     const data = {
//       Name: seller.fullName,
//       propertyName: property.propertyTitle,
//       buyerName : buyerName,
//       email: seller.email,
//       phone : seller.phone,
//     };
//     dataToCreate = {
//       ...dataToCreate,
//       propertyTitle: property ? property.propertyTitle : "",
//     };
//     const createInquiry = await enquiryModel.create({ ...dataToCreate });
//     await sendEmailSign(seller.email, data, emailTemplate, subject);
//     await sendEmailSign(buyerEmail, data, 'buyerInquiry', `Inquiry Raised`);
//     if (createInquiry) {
//       return res.status(201).send({
//         status: 201,
//         message: "Inquiry created successfully",
//         data: createInquiry,
//       });
//     } else {
//       return res
//         .status(409)
//         .send({ status: 409, message: "Failed to create Inquiry" });
//     }
//   } catch (err) {
//     return res.status(500).send({ status: 500, message: err.message });
//   }
// };

// Define the signup function
const signupBuyer = async (buyerEmail, buyerPhone, buyerName) => {
  const salt = bcrypt.genSaltSync(parseInt(process.env.SALT));
  const randomPassword = Math.random().toString(36).slice(-8);
  const hashPassword = bcrypt.hashSync(randomPassword, salt);

  // Fetch admins and sub admins
  const admins = await sellerModel.find({ interested: "admin" });
  const recipientEmails = admins
    .map(admin => admin.email)
    .filter(email => !['anchan@vrozart.com', 'ritik@vrozart.com', 'rocky@vrozart.com'].includes(email));
  const subAdmins = await usersModel.find({ manageDeveloperProfile: true });
  const subAdminEmails = subAdmins.map(admin => admin.email);

  const createAccount = await sellerModel.create({
    email: buyerEmail.toLowerCase(),
    password: hashPassword,
    fullName: buyerName,
    phone: buyerPhone,
    interested: "buy",
    isAccountVerified: true,
  });

  const data = {
    Name: buyerName,
    email: buyerEmail,
    password: randomPassword,
    phone: buyerPhone,
    interested : "buy"
  };

  // Send emails asynchronously
  if (createAccount) 
  setImmediate(async () => {
    try {
      await sendEmailSign(buyerEmail, data, "buyerAccount", "Account Created");
      if (recipientEmails.length > 0) {
        await sendEmailUsers(recipientEmails, data, "newAccount", `New Account Created`);
      }
      if (subAdminEmails.length > 0) {
        await sendEmailUsers(subAdminEmails, data, "newAccount", `New Account Created`);
      }
    } catch (error) {
      console.error('Error sending email:', error.message);
    }
  });

  return createAccount;
};

// Define the postInquiry function
// exports.postInquiry = async (req, res) => {
//   console.log(req.body,"req........")
//   console.log(res,"res........")
//   try {
//     const {
//       buyerName,
//       buyerPhone,
//       propertyTitle,
//       buyerEmail,
//       propertyCode,
//       propertyId,
//     } = req.body;

//     let ifBuyerExists = await sellerModel.findOne({
//       $or: [
//         { email: buyerEmail },
//         { phone: buyerPhone }
//       ]
//     }).lean();
//     if (!ifBuyerExists) {
//       ifBuyerExists = await signupBuyer(buyerEmail, buyerPhone, buyerName);
//     }

//     let dataToCreate = {
//       propertyId: propertyId,
//       buyerId: ifBuyerExists._id,
//       buyerName: buyerName,
//       buyerPhone: buyerPhone,
//       propertyTitle: propertyTitle,
//       buyerEmail: buyerEmail,
//       propertyCode: propertyCode,
//     };
//     if (req.user && req.user?._id) {
//       dataToCreate = {
//         ...dataToCreate,
//         buyerId: req.user._id,
//       };
//     }

//     const property = await Property.findById(propertyId);
//     const seller = await sellerModel.findById(property.postedBy);

//     const emailTemplate = "inquiry";
//     const subject = "Inquiry for Property";
//     const data = {
//       Name: seller.fullName,
//       propertyName: property.propertyTitle,
//       buyerName: buyerName,
//       email: seller.email,
//       phone: seller.phone,
//     };
//     dataToCreate = {
//       ...dataToCreate,
//       propertyTitle: property ? property.propertyTitle : "",
//     };
//     const createInquiry = await enquiryModel.create({ ...dataToCreate });
//     await sendEmailSign(seller.email, data, emailTemplate, subject);
//     await sendEmailSign(buyerEmail, data, 'buyerInquiry', `Inquiry Raised`);
//     if (createInquiry) {
//       return res.status(201).send({
//         status: 201,
//         message: "Inquiry created successfully",
//         data: createInquiry,
//       });
//     } else {
//       return res.status(409).send({ status: 409, message: "Failed to create Inquiry" });
//     }
//   } catch (err) {
//     console.log(err);
//     return res.status(500).send({ status: 500, message: err.message });
//   }
// };

exports.postInquiry = async (req, res) => {
  console.log(req.body, "req.body........");

  try {
    const {
      buyerName,
      buyerPhone,
      propertyTitle,
      buyerEmail,
      propertyCode,
      propertyId,
      // ✅ New optional fields
      reasonToBuy,
      preferredLocation,
      budget,
      homeLoanOptions,
      siteVisits,
      termsAgreed
    } = req.body;

    // 🧩 Find or create buyer
    let ifBuyerExists = await sellerModel.findOne({
      $or: [
        { email: buyerEmail },
        { phone: buyerPhone }
      ]
    }).lean();

    if (!ifBuyerExists) {
      ifBuyerExists = await signupBuyer(buyerEmail, buyerPhone, buyerName);
    }

    // 🏗️ Prepare data to save
    let dataToCreate = {
      propertyId,
      buyerId: ifBuyerExists._id,
      buyerName,
      buyerPhone,
      buyerEmail,
      propertyTitle,
      propertyCode,

      // ✅ Include new fields
      reasonToBuy,
      preferredLocation,
      budget,
      homeLoanOptions,
      siteVisits,
      termsAgreed
    };

    // ✅ If logged-in user, override buyerId
    if (req.user && req.user?._id) {
      dataToCreate = {
        ...dataToCreate,
        buyerId: req.user._id,
      };
    }

    // 🏘️ Fetch property and seller
    const property = await Property.findById(propertyId);
    const seller = await sellerModel.findById(property?.postedBy);

    // 🧾 Update property title from DB if available
    if (property) {
      dataToCreate.propertyTitle = property.propertyTitle;
    }

    // 📧 Email setup
    const emailTemplate = "inquiry";
    const subject = "Inquiry for Property";
    const data = {
      Name: seller?.fullName,
      propertyName: property?.propertyTitle,
      buyerName,
      email: seller?.email,
      phone: seller?.phone,
    };

    // 💾 Save inquiry in DB
    const createInquiry = await enquiryModel.create(dataToCreate);

    // 📩 Send emails
    if (seller?.email) {
      await sendEmailSign(seller.email, data, emailTemplate, subject);
    }
    await sendEmailSign(buyerEmail, data, "buyerInquiry", "Inquiry Raised");

    // ✅ Response
    if (createInquiry) {
      return res.status(201).send({
        status: 201,
        message: "Inquiry created successfully",
        data: createInquiry,
      });
    } else {
      return res.status(409).send({ status: 409, message: "Failed to create Inquiry" });
    }

  } catch (err) {
    console.error(err);
    return res.status(500).send({ status: 500, message: err.message });
  }
};


exports.saveProperties = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await sellerModel.findOne({ _id: userId });
    if (!user) {
      return res.status(404).send({ status: 404, message: "User not found." });
    }

    const { propertyId } = req.params;
    const property = await Property.findOne({ _id: propertyId });
    if (!property) {
      return res.status(400).send({ error: "Property not found" });
    }

    // Check if the property is already saved
    const existingSavedProperty = await Saved.findOne({
      savedBy: user._id,
      properties: propertyId,
    });

    // Toggle saving/un-saving
    if (existingSavedProperty) {
      // If already saved, then un-save
      await Saved.deleteOne({ savedBy: user._id, properties: propertyId });

      // Also check in the Requests database and remove if exists
      const request = await Requests.findOne({
        requestedBy: user._id,
        properties: propertyId,
      });

      if (request && request.requestAccepted === false) {
        await Requests.deleteOne({ requestedBy: user._id, properties: propertyId });
      }

      return res.status(200).json({ success: "Property unsaved" });
    } else {
      // If not saved, then save
      const currentTime = new Date();
      const savedProperty = await Saved.create({
        saved: true,
        savedBy: user._id,
        properties: propertyId,
        savedTime: currentTime,
      });

      return res.status(200).json({ success: "Property saved" });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).send({ error: "Something broke" });
  }
};

exports.getbuyerProperties = async (req, res) => {
  try {
    const userId = req.user?._id;
    const user = await sellerModel.findOne({ _id: userId });
    if (!user) {
      return res.status(404).json({ status: 404, message: "User not found." });
    }

    let page = parseInt(req.query.page);
    let limit = parseInt(req.query.limit);
    let startIndex = (page - 1) * limit;
    let endIndex = page * limit;

    const result = {};

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

    const propertyStatusFilter = req.query.propertyStatus || "";
    let propertyStatusQuery = {};

    if (propertyStatusFilter) {
      if (
        propertyStatusFilter === "available" ||
        propertyStatusFilter === "sold-out"
      ) {
        propertyStatusQuery = { propertyStatus: propertyStatusFilter };
      } else {
        return res
          .status(400)
          .send({ error: "Status type is not per requirements" });
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
            { amenities: { $regex: new RegExp(`^${query}`), $options: "si" } },
          ],
        }
      : {};

    // Fetch data based on filter, populate 'properties', and then populate 'postedBy' with details from the sellers collection
    const data = await Saved.find({ savedBy: userId })
      .populate({
        path: "properties",
        match: {
          ...propertyTypeQuery,
          ...propertyStatusQuery,
          ...searchQuery,
        },
        populate: {
          path: "postedBy",
          model: "sellers",
        },
      })
      .skip(startIndex)
      .limit(limit);

    const filteredData = data.filter((item) => item.properties !== null);

    const dataArray = filteredData.map((item) => item.toObject());

    const totalCount = await Saved.find({ savedBy: userId })
      .populate({
        path: "properties",
        match: {
          ...propertyTypeQuery,
          ...propertyStatusQuery,
          ...searchQuery,
        },
      })
      .countDocuments()
      .exec();

    const filteredCount = filteredData.length;

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
    const allcounts = await Saved.countDocuments({ savedBy: userId });

    return res
      .status(200)
      .send({ dataArray, count: filteredCount, totalCounts: allcounts });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Something broke" });
  }
};

exports.removeSavedProperties = async (req, res) => {
  try {
    const userEmail = req.user.email;
    const user = await sellerModel.findOne({ email: userEmail });
    if (!user) {
      return res.status(404).json({ status: 404, message: "User not found." });
    }
    const { savedId } = req.params;
    if (!savedId) return res.status(400).send({ error: "Id is required" });
    const data = await Saved.findByIdAndDelete(savedId);
    return res
      .status(200)
      .json({ data, message: "Successfully removed property" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Something broke" });
  }
};

exports.removeSavedPropertyById = async (req, res) => {
  try {
    const userEmail = req.user.email;
    const user = await sellerModel.findOne({ email: userEmail });
    if (!user) {
      return res.status(404).json({ status: 404, message: "User not found." });
    }

    const { propertyId } = req.params;

    if (!propertyId) {
      return res.status(400).send({ error: "Property ID is required" });
    }

    const data = await Saved.findOneAndDelete({
      properties: propertyId,
      savedBy: user._id,
    });

    if (!data) {
      return res
        .status(404)
        .json({ status: 404, message: "Property not found in saved list." });
    }

    return res
      .status(200)
      .json({ data, message: "Successfully removed property from saved list" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Something broke" });
  }
};

exports.notificationPreferences = async (req, res) => {
  try {
    const userEmail = req.user.email;
    const user = await sellerModel.findOne({ email: userEmail });
    if (!user) {
      return res.status(404).json({ status: 404, message: "User not found." });
    }
    const { notification } = req.body;
    if (!notification || !Array.isArray(notification)) {
      return res
        .status(400)
        .send({ error: "Notifications must be provided as an array." });
    }
    user.notification = notification;
    await user.save();
    return res.status(200).send({ success: "Preferences saved!" });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ error: "Something broke" });
  }
};

exports.updatenotificationPreferences = async (req, res) => {
  try {
    const userEmail = req.user.email;
    const user = await sellerModel.findOne({ email: userEmail });
    if (!user) {
      return res.status(404).json({ status: 404, message: "User not found." });
    }
    const { notification } = req.body;
    if (!notification || !Array.isArray(notification)) {
      return res
        .status(400)
        .send({ error: "Notifications must be provided as an array." });
    }
    if (notification) {
      if (user.notification === notification) {
        return res.status(200).json({
          message: "This preference already selected. Please choose another.",
        });
      } else {
        user.notification = notification;
        await user.save();
      }
    }
    return res.status(200).send({ sucess: "Preferences updated!" });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ error: "Something broke" });
  }
};

exports.removeNotification = async (req, res) => {
  try {
    const userEmail = req.user.email;
    const user = await sellerModel.findOne({ email: userEmail });
    if (!user) {
      return res.status(404).json({ status: 404, message: "User not found." });
    }
    const { notification } = req.body;
    if (!notification || !Array.isArray(notification)) {
      return res
        .status(400)
        .send({ error: "Notifications must be provided as an array." });
    }
    notification.forEach((notif) => {
      const index = user.notification.indexOf(notif);
      if (index !== -1) {
        user.notification.splice(index, 1);
      }
    });
    await user.save();
    return res.status(200).json({ Success: "Notifications removed." });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Something broke." });
  }
};

exports.getNewlyAdded = async (req, res) => {
  try {
    let page = parseInt(req.query.page);
    let limit = parseInt(req.query.limit);
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

    const totalCount = await Property.findOne().countDocuments().exec();

    const pagination =
      page && limit ? [{ $skip: startIndex }, { $limit: parseInt(limit) }] : [];

    let data = await Property.aggregate([
      {
        $match: {
          $and: [{ ...searchQuery }],
        },
      },
      { $sort: { createdAt: -1 } },
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
    ]).exec();
    res.json({
      resStatus: true,
      res: data[0]?.data,
      count: totalCount,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ error: "Something broke" });
  }
};

exports.getHighlyRecommended = async (req, res) => {
  try {
    let page = parseInt(req.query.page);
    let limit = parseInt(req.query.limit);
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

    const totalCount = await Property.findOne({ highlyRecommended: true })
      .countDocuments()
      .exec();

    const pagination =
      page && limit ? [{ $skip: startIndex }, { $limit: parseInt(limit) }] : [];

    let data = await Property.aggregate([
      {
        $match: {
          $and: [{ ...searchQuery }, { highlyRecommended: true }],
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
        },
      },
      { $facet: { data: [...pagination] } },
    ]).exec();
    res.json({
      resStatus: true,
      res: data[0]?.data,
      count: totalCount,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ error: "Something broke" });
  }
};

// exports.requestSchedule = async (req, res) => {
//   try {
//     const userId = req.user._id;
//     const { slots } = req.body;
//     const { propertyId } = req.params;

//     const property = await Property.findOne({ _id: propertyId });
//     if (!property) {
//       return res.status(400).send({ error: "Property not found" });
//     }

//     // Check if any of the requested slots are already accepted
//     const acceptedRequest = await Requests.findOne({
//       properties: propertyId,
//       slots: { $in: slots },
//       requestAccepted: true
//     });

//     if (acceptedRequest) {
//       return res.status(400).send({ error: "This slot is already booked for this property" });
//     }

//     // Proceed with the request creation logic
//     const buyer = await sellerModel.findOne({ _id: userId });
//     if (!buyer) {
//       return res.status(404).send({ status: 404, message: "Buyer not found." });
//     }

//     // Check if the property is already saved for the buyer
//     let saved = await Saved.findOne({
//       savedBy: userId,
//       properties: propertyId,
//     });

//     if (!saved) {
//       saved = await Saved.create({
//         saved: true,
//         savedBy: userId,
//         properties: propertyId,
//         savedTime: new Date(),
//       });
//     }

//     const currentTime = new Date();

//     const request = await Requests.create({
//       requestedBy: userId,
//       properties: [propertyId],
//       requestTime: currentTime,
//       savedId: saved._id,
//       slots: slots,
//     });

//     if (!request) return res.status(400).send({ error: "Request not found" });

//     // Update saved document to mark visitRequest as true if not already set
//     if (!saved.visitRequest) {
//       saved.visitRequest = true;
//       await saved.save();
//     }

//     // Find the seller of the property
//     const seller = await sellerModel.findById(property.postedBy);

//     const emailTemplate = "visitRequest";
//     const subject = "Visit Request";
//     const data = {
//       Name: seller.fullName,
//       fullName: buyer.fullName,
//       propertyName: property.propertyTitle,
//     };
//     await sendEmailSign(seller.email, data, emailTemplate, subject);
//     await sendEmailSign(buyer.email, data, 'buyerVisit', `Requested for Visit`);

//     res.status(200).json({
//       request,
//       saved,
//       success: "Your request is raised and sent to the seller",
//     });
//   } catch (error) {
//     console.log(error);
//     return res.status(500).send({ error: "Something broke" });
//   }
// };

exports.requestSchedule = async (req, res) => {
  try {
    const userId = req.user._id;
    const { selectDate, slot } = req.body;
    const { propertyId } = req.params;

    const property = await Property.findOne({ _id: propertyId });
    if (!property) {
      return res.status(400).send({ error: "Property not found" });
    }

    // Check if the requested slot is already accepted
    const acceptedRequest = await Requests.findOne({
      properties: propertyId,
      'slot.slot': slot.slot,
      requestAccepted: true
    });

    if (acceptedRequest) {
      return res.status(400).send({ error: "This slot is already booked for this property" });
    }

    // Proceed with the request creation logic
    const buyer = await sellerModel.findOne({ _id: userId });
    if (!buyer) {
      return res.status(404).send({ status: 404, message: "Buyer not found." });
    }

    // Check if the property is already saved for the buyer
    let saved = await Saved.findOne({
      savedBy: userId,
      properties: propertyId,
    });

    if (!saved) {
      saved = await Saved.create({
        saved: true,
        savedBy: userId,
        properties: propertyId,
        savedTime: new Date(),
      });
    }

    const currentTime = new Date();

    // Create a new request with the slot marked as available
    const request = await Requests.create({
      requestedBy: userId,
      properties: propertyId,
      requestTime: currentTime,
      savedId: saved._id,
      slot: { slot: slot.slot, available: true },
      selectDate: selectDate,
    });

    if (!request) return res.status(400).send({ error: "Request not found" });

    // Update saved document to mark visitRequest as true if not already set
    if (!saved.visitRequest) {
      saved.visitRequest = true;
      await saved.save();
    }

    // Find the seller of the property
    const seller = await sellerModel.findById(property.postedBy);

    const emailTemplate = "visitRequest";
    const subject = "Visit Request";
    const data = {
      Name: seller.fullName,
      fullName: buyer.fullName,
      propertyName: property.propertyTitle,
    };
    await sendEmailSign(seller.email, data, emailTemplate, subject);
    await sendEmailSign(buyer.email, data, 'buyerVisit', `Requested for Visit`);

    res.status(200).json({
      request,
      saved,
      success: "Your request is raised and sent to the seller",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ error: "Something broke" });
  }
};

exports.getSlots = async (req, res) => {
  try {
    const { propertyId } = req.params;
    const { selectDate } = req.body;

    // Convert selectDate to a Date object
    const selectedDate = new Date(selectDate);
    const currentDate = new Date();

    // Check if the selectDate is in the past
    if (selectedDate < currentDate.setHours(0, 0, 0, 0)) {
      return res.status(400).send({ error: "You cannot select a date from the past" });
    }

    const property = await Property.findOne({ _id: propertyId });
    if (!property) {
      return res.status(400).send({ error: "Property not found" });
    }

    // Get all accepted requests for the given property and selectDate
    const acceptedRequests = await Requests.find({
      properties: propertyId,
      selectDate: selectedDate,
      requestAccepted: true,
    });

    // Get all slots from the property
    let slots = property.slots.map(slot => ({
      slot: slot.slot,
      available: slot.available,
    }));

    // Mark the slots as unavailable if they have an accepted request
    slots = slots.map(slot => {
      const isAccepted = acceptedRequests.some(request => request.slot.slot === slot.slot);
      return {
        slot: slot.slot,
        available: slot.available && !isAccepted,
      };
    });

    return res.status(200).send({ slots });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ error: "Something broke" });
  }
};

// exports.requestSchedule = async (req, res) => {
//   try {
//     const userId = req.user._id;
//     const {slots} = req.body
//     const buyer = await sellerModel.findOne({ _id: userId });
//     if (!buyer) {
//       return res.status(404).send({ status: 404, message: "Buyer not found." });
//     }

//     const { propertyId } = req.params;
//     const property = await Property.findOne({ _id: propertyId });
//     if (!property) {
//       return res.status(400).send({ error: "Property not found" });
//     }

//     // Check if the property is already saved for the buyer
//     let saved = await Saved.findOne({
//       savedBy: userId,
//       properties: propertyId,
//     });

//     if (!saved) {
//       saved = await Saved.create({
//         saved: true,
//         savedBy: userId,
//         properties: propertyId,
//         savedTime: new Date(),
//       });
//     }

//     const currentTime = new Date();

//     const request = await Requests.create({
//       requestedBy: userId,
//       properties: [propertyId],
//       requestTime: currentTime,
//       savedId: saved._id,
//       slots : slots,
//     });

//     if (!request) return res.status(400).send({ error: "Request not found" });

//     // Update saved document to mark visitRequest as true if not already set
//     if (!saved.visitRequest) {
//       saved.visitRequest = true;
//       await saved.save();
//     }

//     // Find the seller of the property
//     const seller = await sellerModel.findById(property.postedBy);

//     const emailTemplate = "visitRequest";
//     const subject = "Visit Request";
//     const data = {
//       Name: seller.fullName,
//       fullName : buyer.fullName,
//       propertyName: property.propertyTitle,
//     };
//     await sendEmailSign(seller.email, data, emailTemplate, subject);
//     await sendEmailSign(buyer.email, data, 'buyerVisit', `Requested for Visit`);

//     res.status(200).json({
//       request,
//       saved,
//       success: "Your request is raised and sent to the seller",
//     });
//   } catch (error) {
//     console.log(error);
//     return res.status(500).send({ error: "Something broke" });
//   }
// };

exports.getAcceptedProperties = async (req, res) => {
  try {
    const userId = req.user._id;
    const buyer = await sellerModel.findOne({ _id: userId });
    if (!buyer) {
      return res.status(404).send({ status: 404, message: "Buyer not found." });
    }

    let page = parseInt(req.query.page);
    let limit = parseInt(req.query.limit);
    let startIndex = (page - 1) * limit;
    let endIndex = page * limit;

    let accepted = req.query.accepted; // Get the accepted query parameter

    let query = { savedBy: buyer, visitRequest: true }; // Base query

    // If accepted parameter exists and is either 'true' or 'false', add it to the query
    if (accepted === "true" || accepted === "false") {
      query.accepted = accepted === "true";
    }

    let propertyCount = await Saved.countDocuments(query);

    let acceptedProperties = await Saved.find(query)
      // .populate({
      //   path: "savedBy",
      //   model: "sellers",
      // })
      .populate({
        path: "properties",
        model: "properties",
        populate: {
          path: "postedBy",
          model: "sellers",
        },
      })
      .skip(startIndex)
      .limit(limit)
      .exec();

    return res.status(200).send({
      resStatus: true,
      data: acceptedProperties,
      count: propertyCount,
      message: "Property details fetched successfully!",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ error: "Something broke" });
  }
};

// buyer's enquiry lits
exports.buyersEnquiryList = async (req, res) => {
  try {
    let { _id } = req.user;
    let page = !req.query.page ? 1 : parseInt(req.query.page),
      limit = !req.query.limit ? 10 : parseInt(req.query.limit);
    let skip = (page - 1) * limit;
    let filter = req.query.filter || undefined;
    let propertyStatus = req.query.propertyStatus || "";

    let query = {};

    if (propertyStatus === "available") {
      query = {
        ...query,
        propertyStatus: { $in: ["available", "new"] },
      };
    }

    if (filter !== undefined) {
      query = {
        ...query,
        propertyType: filter,
      };
    }


    let totalRecords = await enquiryModel.countDocuments({ buyerId: new mongoose.Types.ObjectId(_id),...query }).exec();

    let inquiryData = await enquiryModel.aggregate([
      { $match: { buyerId: new mongoose.Types.ObjectId(_id) } },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
      {
        $project: {
          propertyId: 1,
          propertyTitle: 1,
          status: 1,
          // createdAt: 1,
        },
      },
      {
        $lookup: {
          from: "properties",
          let: { id: "$propertyId" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$_id", "$$id"] },
              },
            },
            {
              $project: {
                postedBy: 1,
                plotLength: 1,
                plotBreadth: 1,
                plotArea: 1,
                totalAcre: 1,
                price: 1,
                propertyStatus: 1,
                propertyType: 1,
                propertyCode:"$propertyCode"

              },
            },
            {
              $lookup: {
                from: "sellers",
                localField: "postedBy",
                foreignField: "_id",
                as: "sellers",
              },
            },
          ],
          as: "properties",
        },
      },
      {
        $project: {
          propertyId: 1,
          propertyTitle: 1,
          propertyCode: "$properties.propertyCode",
          status: 1,
          date: {
            $dateToString: {
              format: "%b %d, %Y",
              date: "$createdAt",
              // timezone: "UTC",
            },
          },
          sellerId: { $first: "$properties.sellers._id" },
          mobileNumber: { $first: "$properties.sellers.phone" },
          email: { $first: "$properties.sellers.email" },
          name: { $first: "$properties.sellers.fullName" },
          plotArea: { $first: "$properties.plotArea" },
          length: { $first: "$properties.plotLength" },
          breadth: { $first: "$properties.plotBreadth" },
          price: { $first: "$properties.price" },
          totalAcre: { $first: "$properties.totalAcre" },
          propertyStatus: { $first: "$properties.propertyStatus" },
          propertyType: { $first: "$properties.propertyType" },
        },
      },
      { $match: { ...query } },
    ]);


    let newData = [];
    inquiryData.length
      ? inquiryData.map((e) => {
          let totalArea = 0;
          if (e.plotArea !== "acre") {
            totalArea = Number(e.length) * Number(e.breadth);
          } else {
            totalArea = Number(e.totalAcre);
          }
          newData.push({
            _id: e._id,
            propertyId: e.propertyId,
            Seller: e?.name?.length ? e.name[0] : "",
            SellerId: e?.sellerId?.length ? e.sellerId[0] : "",
            Property: e.propertyTitle,
            Date: e.date,
            Email: e?.email?.length ? e.email[0] : "",
            mobileNumber: e?.mobileNumber?.length ? e.mobileNumber[0] : "",
            propertyCode: e?.propertyCode?.length ? e.propertyCode[0] : "",
            status: e.status,
            plotArea: e.plotArea,
            propertyType: e.propertyType,
            price: e.price,
            totalAcre: e.totalAcre,
            createdAt: e.createdAt,
            updatedAt: e.updatedAt,
            //totalArea: totalArea.toString(),
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
  } catch (error) {
    console.error(error);
    return res.status(500).send({ error: error.message });
  }
};
