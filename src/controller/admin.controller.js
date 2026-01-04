const enquiryModel = require("../model/enquiry.model");
const { validationResult } = require("express-validator");
const moment = require("moment");
const bcrypt = require("bcryptjs");
const { generateVerificationToken } = require("./auth.controller");
const sendEmailSign = require("../utils/emailSend.js");
const {
  uploadImage,
  uploadVideo,
  uploadPDF,
} = require("../utils/conrollerUtils");
const { v4: uuidv4 } = require("uuid");
const activityTrackerModel = require("./../model/activityTracker.model.js");
const Property = require("../model/property.model");
const Seller = require("../model/seller.model");
const usersModel = require("../model/users.model.js");
const sellerSubModel = require("../model/sellerSub.model");
const propertyCategoryModel = require("../model/propertyCategory.model.js");
const Saved = require("../model/buyerSaved.js");
const sendEmailUsers = require("../utils/emailSend.js");
const mongoose = require("mongoose");
const CryptoJS = require("crypto-js");
const os = require('os');

// encryption & decryption of user password
const key = "EVOKEY@111";

function encrypt(text) {
  return CryptoJS.AES.encrypt(text, key).toString();
}

const checkAdmin = async (req, res) => {
  const adminId = req.user?._id;
  if (!adminId) return res.status(400).send({ error: "Admin not found" });

  try {
    const user = await Seller.findOne({ _id: adminId });
    if (!user) return res.status(400).send({ error: "Admin does not exist" });

    if (user.interested !== "admin") {
      return res.status(400).send({ error: "You are not allowed" });
    }

    return true;
  } catch (error) {
    console.error("Error in admin check:", error);
    return res.status(500).send({ error: "Internal Server Error" });
  }
};

exports.property_list = async (req, res) => {
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
                $regex: new RegExp(query),
                $options: "si",
              },
            },
            {
              state: {
                $regex: new RegExp(query),
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

    let filter = req.query.propertyStatus || "";
    let filterPropertyStatus = {};
    if (filter) {
      if (filter === "sold-out") {
        filterPropertyStatus = { propertyStatus: "sold-out" };
      } else if (filter === "available") {
        filterPropertyStatus = { propertyStatus: "available" };
      } else {
        return res
          .status(400)
          .send({ error: "Filter is not per requirements" });
      }
    }

    let propertyApproval = req.query.propertyApproval || "";
    let filterPropertyApproval = {};
    if (propertyApproval) {
      if (propertyApproval === "IN_Review") {
        filterPropertyApproval = { propertyApproval: "IN_Review" };
      } else if (propertyApproval === "Resolved") {
        filterPropertyApproval = { propertyApproval: "Resolved" };
      } else if (propertyApproval === "Reject") {
        filterPropertyApproval = { propertyApproval: "Reject" };
      } else {
        return res.status(400).send({ error: "Filter is not per requirements" });
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

    let archiveFilter = {};
    if (req.query.hasOwnProperty("isDeleted")) {
      const isDeleted = req.query.isDeleted.toLowerCase() === "true";
      archiveFilter.isDeleted = isDeleted;
    }

    const totalCount = await Property.find({ ...cityType,  status: "publish", })
      .countDocuments()
      .exec();

    const pagination =
      page && limit ? [{ $skip: startIndex }, { $limit: parseInt(limit) }] : [];

    let data = await Property.aggregate([
      {
        $match: {
          $and: [
            { ...searchQuery },
            { ...filterPropertyStatus },
            { ...propertyTypeQuery },
            { ...filterPropertyApproval },
            { ...amenitiesQuery },
            { ...cityType },
            { ...archiveFilter },
            { status: "publish" },
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
      // {
      //   $lookup : {
      //     from : "sellers",
      //     localField : "addBy",
      //     foreignField : "_id",
      //     as : "addBy",
      //   }
      // },
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

    const queryCount = await Property.aggregate([
      {
        $match: {
          $and: [
            { ...searchQuery },
            { ...filterPropertyStatus },
            { ...propertyTypeQuery },
            { ...filterPropertyApproval },
            { ...amenitiesQuery },
            { ...cityType },
            { ...archiveFilter },
            { status: "publish" },
          ],
        },
      },
      { $count: "count" },
    ]).exec();

    // Extract the count value from queryCount array
    const filterCount = queryCount.length > 0 ? queryCount[0].count : 0;

    res.json({
      resStatus: true,
      res: data[0]?.data,
      count: totalCount,
      filterCount: filterCount,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.adiminEditProperty = async (req, res) => {
  try {
    const propertyCode = req.query.propertyCode;
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.send({ status: 422, errors: errors.array() });
    }

    const payload = req.body;
    let re = new RegExp("^(http|https)://", "i");

    let {
      postedBy,
      price,
      plotLength,
      plotBreadth,
      images,
      videos,
      layoutMap,
      heroImage,
      categoryId,
      masterPlan,
      totalAcre,
      plotArea,
      isPropertyPromoted,
      propertyAds,
      logo,
      maintainanceBills,
      propertyPapers,
      documentName,
      documentFile,
      daysAvailiblity,
      alldaysAvailable,
      from,
      to,
      slots,
      city,
      priceMax,
      minArea,
      maxArea,
      pricePerMeter,
      pricePerYard,
      areaType,
      broucher,
      userInput,
      manageFarms,
      maintainaceOfYears,
      bathrooms,
      bedrooms,
      balconies,
      buildUpArea,
      floorDetails,
      ageOfProperty,
      transactionType,
      ownershipType,
      facing,
      facingRoadWidth,
      facingWidthType,
      bedroomsImages,
      bathroomsImages,
      exteriorViewImages,
      kitchenImages,
      floorPlanImages,
      farmhouseStatus,
      landmark,
    } = payload;

    let imagesArray = [],
      layoutMapArray = [],
      heroImageUrl = "",
      masterPlanUrl = "",
      propertyAdsUrl = "",
      maintainanceBillsArray = [],
      propertyPapersArray = [],
      logoUrl = "",
      videosArray = [];

    let area = 0,
      pricePerSqft = 0;
    if (plotLength && plotBreadth) {
      area = Number(plotLength) * Number(plotBreadth);
      pricePerSqft = (Number(price) / area).toFixed(2);
    }

    const existingProperty = await Property.findOne({ propertyCode });

    if (!existingProperty) {
      return res.status(404).send({ status: 404, message: "Property not found" });
    }

    if (!layoutMap) {
      layoutMapArray = existingProperty.layoutMap || [];
    }

    if (heroImage) {
      if (!re.test(heroImage)) {
        const heroImageResult = await uploadImage(heroImage);
        heroImageUrl = heroImageResult.Location;
      }
    }
    if (logo) {
      if (!re.test(logo)) {
        const logoResult = await uploadImage(logo);
        logoUrl = logoResult.Location;
      }
    }
    if (masterPlan) {
      if (!re.test(masterPlan)) {
        const masterPlanResult = await uploadImage(masterPlan);
        masterPlanUrl = masterPlanResult.Location;
      }
    }
    if (images && images.length) {
      for (let i = 0; i < images.length; i++) {
        if (!re.test(images[i])) {
          const imageResult = await uploadImage(images[i]);
          imagesArray.push(imageResult.Location);
        } else {
          imagesArray.push(images[i]);
        }
      }
    }
    if (maintainanceBills && maintainanceBills.length) {
      for (let i = 0; i < maintainanceBills.length; i++) {
        if (!re.test(maintainanceBills[i])) {
          const maintainanceBillsResult = await uploadPDF(maintainanceBills[i]);
          maintainanceBillsArray.push(maintainanceBillsResult.Location);
        } else {
          maintainanceBillsArray.push(maintainanceBills[i]);
        }
      }
    }
    if (propertyPapers && propertyPapers.length) {
      for (let i = 0; i < propertyPapers.length; i++) {
        if (!re.test(propertyPapers[i])) {
          const propertyPapersResult = await uploadPDF(propertyPapers[i]);
          propertyPapersArray.push(propertyPapersResult.Location);
        } else {
          propertyPapersArray.push(propertyPapers[i]);
        }
      }
    }
    if (isPropertyPromoted) {
      if (propertyAds) {
        if (!re.test(propertyAds)) {
          const propertyAdsResult = await uploadPDF(propertyAds);
          propertyAdsUrl = propertyAdsResult.Location;
        }
      }
    }
    if (videos && videos.length) {
      for (let i = 0; i < videos.length; i++) {
        if (!re.test(videos[i])) {
          const videoResult = await uploadVideo(videos[i]);
          videosArray.push(videoResult.Location);
        } else {
          videosArray.push(videos[i]);
        }
      }
    }
    if (layoutMap && layoutMap.length) {
      for (let i = 0; i < layoutMap.length; i++) {
        if (!re.test(layoutMap[i])) {
          const layoutMapResult = await uploadImage(layoutMap[i]);
          layoutMapArray.push(layoutMapResult.Location);
        } else {
          layoutMapArray.push(layoutMap[i]);
        }
      }
    }

    const generateSlots = (from, to) => {
      const startTime = moment("08:00:00", "HH:mm:ss");
      const endTime = moment("22:00:00", "HH:mm:ss");
      const interval = 30; // 30 minutes interval
      const slots = [];
      const userFrom = moment(from, "HH:mm:ss");
      const userTo = moment(to, "HH:mm:ss");

      while (startTime.isBefore(endTime)) {
        const slotTime = startTime.format("HH:mm:ss");
        const isAvailable = startTime.isSameOrAfter(userFrom) && startTime.isBefore(userTo);
        slots.push({ slot: slotTime, available: isAvailable });
        startTime.add(interval, "minutes");
      }

      return slots;
    };

    let data = {
      ...payload,
    };

    if (heroImageUrl !== "") {
      data.heroImage = heroImageUrl;
    }
    if (logoUrl !== "") {
      data.logo = logoUrl;
    }
    if (masterPlanUrl !== "") {
      data.masterPlan = masterPlanUrl;
    }
    if (propertyAdsUrl !== "") {
      data.propertyAds = propertyAdsUrl;
    }
    if (imagesArray.length) {
      data.images = imagesArray;
    }
    if (videosArray.length) {
      data.videos = videosArray;
    }
    if (maintainanceBillsArray.length) {
      data.maintainanceBills = maintainanceBillsArray;
    }
    if (propertyPapersArray.length) {
      data.propertyPapers = propertyPapersArray;
    }
    if(documentName){
      data.documentName = documentName
    }
    if(documentFile){
      data.documentFile = documentFile
    }
    if (layoutMapArray.length) {
      data.layoutMap = layoutMapArray;
    }
    
    if(priceMax){
      data.priceMax = priceMax
    }
    if(minArea){
      data.minArea = minArea
    }
    if(maxArea){
      data.maxArea = maxArea
    }
    if(pricePerMeter){
      data.pricePerMeter = pricePerMeter
    }
    if(pricePerYard){
      data.pricePerYard = pricePerYard
    }
    if(areaType){
      data.areaType = areaType
    }
    if(broucher){
      data.broucher = broucher
    }
    if(userInput){
      data.userInput = userInput
    }
    if(manageFarms){
      data.manageFarms = manageFarms
    }
    if(maintainaceOfYears){
      data.maintainaceOfYears = maintainaceOfYears
    }
    if(bathrooms){
      data.bathrooms = bathrooms
    }
    if(bedrooms){
      data.bedrooms = bedrooms
    }
    if(balconies){
      data.balconies = balconies
    }
    if(facingRoadWidth){
      data.facingRoadWidth = facingRoadWidth
    }
    if(facing){
      data.facing = facing
    }
    if(buildUpArea){
      data.buildUpArea = buildUpArea
    }
    if(facingWidthType){
      data.facingWidthType = facingWidthType
    }
    if(floorDetails){
      data.floorDetails = floorDetails
    }
    if(ageOfProperty){
      data.ageOfProperty = ageOfProperty
    }
    if(transactionType){
      data.transactionType = transactionType
    }
    if(ownershipType){
      data.ownershipType = ownershipType
    }
    if(bedroomsImages){
      data.bedroomsImages = bedroomsImages
    }
    if(bathroomsImages){
      data.bathroomsImages = bathroomsImages
    }
    if(exteriorViewImages){
      data.exteriorViewImages = exteriorViewImages
    }
    if(kitchenImages){
      data.kitchenImages = kitchenImages
    }
    if(floorPlanImages){
      data.floorPlanImages = floorPlanImages
    }
    if(farmhouseStatus){
      data.farmhouseStatus = farmhouseStatus
    }
    if(landmark){
      data.landmark = landmark
    }

    if (!categoryId) {
      const categories = await propertyCategoryModel.find();
      for (const category of categories) {
        if (/elite/i.test(category.name)) {
          const categoryState = category.city.map(c => c.city);;
          const categoryPrice = Number(category.price);
          if (Number(data.price) >= categoryPrice && categoryState.includes(data.city)) {
            categoryId = category._id;
            break;
          }
        } else if (/(hot|highly)/i.test(category.name)) {
          const shortlistCount = await Saved.countDocuments({ properties: existingProperty._id, saved: true });
          const categoryShortlistCount = category.shortlistCount;
          const categoryPropertyView = Number(category.propertyView);
          const propertyView = existingProperty.propertyView;

          if (propertyView >= categoryPropertyView && shortlistCount >= categoryShortlistCount) {
            categoryId = category._id;
            break;
          }
        }
      }
    }

    if (categoryId !== undefined && categoryId !== null) {
      if (categoryId === "") {
        data["propertyCategory.categoryId"] = null;
        data["propertyCategory.status"] = false;
        data.isPropertyPromoted = false;
      } else {
        const category = await propertyCategoryModel.findById(categoryId);
        if (category && /elite/i.test(category.name)) {
          const categoryState = category.city.map(c => c.city);;
          const categoryPrice = Number(category.price);

          if (Number(data.price) < categoryPrice || !categoryState.includes(data.city)) {
            return res.status(400).send({
              status: 400,
              message: "Cannot add this property to the 'elite' category due to Price or City mismatch.",
            });
          }
        } else if (category && /(hot|highly)/i.test(category.name)) {
          const shortlistCount = await Saved.countDocuments({ properties: existingProperty._id, saved: true });
          const categoryShortlistCount = category.shortlistCount;
          const categoryPropertyView = Number(category.propertyView);
          const propertyView = existingProperty.propertyView;

          if (propertyView < categoryPropertyView || shortlistCount < categoryShortlistCount) {
            return res.status(400).send({
              status: 400,
              message: "Cannot add this property to the 'Hot' or 'Highly' category due to less views or shortlist count mismatch.",
            });
          }
        }

        data["propertyCategory.categoryId"] = categoryId;
        data["propertyCategory.status"] = true;
        data.isPropertyPromoted = isPropertyPromoted;
      }
    } else {
      data["propertyCategory.categoryId"] = existingProperty.propertyCategory.categoryId;
      data["propertyCategory.status"] = existingProperty.propertyCategory.status;
      data.isPropertyPromoted = existingProperty.isPropertyPromoted;
    }

    if (pricePerSqft > 0) {
      data.pricePerSqft = pricePerSqft;
    }

    if (daysAvailiblity !== undefined) {
      data.daysAvailiblity = daysAvailiblity;
    } else {
      data.daysAvailiblity = existingProperty.daysAvailiblity;
    }

    if (alldaysAvailable !== undefined) {
      data.alldaysAvailable = alldaysAvailable;
    } else {
      data.alldaysAvailable = existingProperty.alldaysAvailable;
    }

    if (from !== undefined && to !== undefined) {
      data.from = from;
      data.to = to;
      data.slots = generateSlots(from, to);
    } else {
      data.from = existingProperty.from;
      data.to = existingProperty.to;
      data.slots = existingProperty.slots;
    }

    if (postedBy) {
      data.postedBy = postedBy;
    }

    if (req.user?._id) {
      data.editBy = req.user._id;
    }

    const update = { $set: { ...data } };

    const isUpdate = await Property.findOneAndUpdate({ propertyCode }, update, { new: true });
    if (isUpdate) {
      return res.status(200).send({ status: 200, message: "Property updated successfully", data: isUpdate });
    }
    return res.status(200).send({ status: 400, message: "Failed to update property" });
  } catch (err) {
    console.log(err);
    return res.status(500).send({ status: 500, message: err.message });
  }
};


exports.updatePropertyStatus = async (req, res) => {
  try {
    let userId = req.user?._id

    let { propertyId } = req.params;
    let propertyData = await Property.findOne({ _id: propertyId });

    if (!propertyData) {
      return res.status(400).send({ error: "No such property exists" });
    }

    const updatedStatus =
      propertyData.propertyStatus === "available" ? "sold-out" : "available";

    let dataToUpdate = {};
    if (updatedStatus === "sold-out") {
      dataToUpdate = {
        propertyStatus: updatedStatus,
        soldOutDate: new Date(),
      };
    } else {
      dataToUpdate = {
        propertyStatus: updatedStatus,
      };
    }
    const updatedProperty = await Property.findOneAndUpdate(
      { _id: propertyId },
      { $set: { ...dataToUpdate, editBy: userId } },
      { new: true }
    );

    const savedUsers = await Saved.find({ properties: propertyId });
    // Extract email addresses and names of saved users
    const recipients = await Promise.all(
      savedUsers.map(async (savedUser) => {
        const sellerData = await Seller.findOne({ _id: savedUser.savedBy });
        return { email: sellerData.email, name: sellerData.fullName };
      })
    );

    // Send email to all saved users
    if (updatedStatus === "sold-out") {
      console.log(updatedStatus);
      const emailTemplate = "sold-out";
      const subject = "Property Sold Out Notification";
      await Promise.all(
        recipients.map(async (recipient) => {
          const data = {
            propertyName: propertyData.propertyTitle,
            propertyCode: propertyData.propertyCode,
            Name: recipient.name,
          };
          let check = await sendEmailUsers(
            [recipient.email],
            data,
            emailTemplate,
            subject
          );
          console.log(check);
        })
      );

      // Send notification to the seller
      const sellerData = await Seller.findOne({ _id: propertyData.postedBy });
      if (sellerData) {
        const emailTemplate = "seller-sold";
        const subject = "Property Sold Out Notification";
        const data = {
          propertyName: propertyData.propertyTitle,
          propertyCode: propertyData.propertyCode,
          Name: sellerData.fullName,
          status: updatedStatus,
        };
        await sendEmailSign(sellerData.email, data, emailTemplate, subject);
      }
    } else if (updatedStatus === "available") {
      const emailTemplate = "available";
      const subject = "Property Available Notification";
      await Promise.all(
        recipients.map(async (recipient) => {
          const data = {
            propertyName: propertyData.propertyTitle,
            propertyCode: propertyData.propertyCode,
            Name: recipient.name,
          };
          let check = await sendEmailUsers(
            [recipient.email],
            data,
            emailTemplate,
            subject
          );
          console.log(check);
        })
      );

      // Send notification to the seller
      const sellerData = await Seller.findOne({ _id: propertyData.postedBy });
      if (sellerData) {
        const emailTemplate = "seller-available";
        const subject = "Property Available Notification";
        const data = {
          propertyName: propertyData.propertyTitle,
          propertyCode: propertyData.propertyCode,
          Name: sellerData.fullName,
          status: updatedStatus,
        };
        await sendEmailSign(sellerData.email, data, emailTemplate, subject);
      }
    }

    return res.status(200).send({
      message: "Status updated successfully",
      data: updatedProperty,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ error: "Something broke" });
  }
};

//mark property in archive
exports.archiveProperties = async (req, res) => {
  try {
    let userId = req.user?._id
    // const isAdmin = await checkAdmin(req, res);
    // if (!isAdmin) {
    //   return;
    // }
    const { propertyId } = req.params;
    if (!propertyId)
      return res.status(500).send({ error: "Property not found" });

    const property = await Property.findOne({ _id: propertyId });
    if (!property) return res.status(400).send({ error: "Property not found" });

    const updatedStatus = !property.isDeleted;
    let message = "";

    if (updatedStatus) {
      message = "Property add to archive";
    } else {
      message = "Property removed from archive";
    }

    const updateProperty = await Property.findOneAndUpdate(
      { _id: propertyId },
      { $set: { isDeleted: updatedStatus, editBy: userId } },
      { new: true }
    );

    return res.status(200).send({ success: message, updateProperty });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ error: "Something broke" });
  }
};

const sendMailToSeller = async (sellerEmail, data, status) => {
  let emailTemplate;
  let subject;

  switch (status) {
    case "IN_Review":
      emailTemplate = "review";
      subject = "Property In Review";
      break;
    case "Resolved":
      emailTemplate = "approved";
      subject = "Property Status Approved";
      break;
    case "Reject":
      emailTemplate = "reject";
      subject = "Property Rejected";
      break;
    default:
      return;
  }

  await sendEmailSign(sellerEmail, data, emailTemplate, subject);
};

exports.updatePropertyApproval = async (req, res) => {
  try {
    let userId = req.user?._id

    const { propertyId } = req.params;
    if (!propertyId) {
      return res.status(400).send({ error: "Property ID not provided" });
    }

    const { propertyApproval, reason } = req.body;
    if (
      !propertyApproval ||
      !["IN_Review", "Resolved", "Reject"].includes(propertyApproval)
    ) {
      return res
        .status(400)
        .send({ error: "Invalid property approval status" });
    }

    const updatedProperty = await Property.findOneAndUpdate(
      { _id: propertyId },
      { $set: { propertyApproval, editBy: userId } },
      { new: true }
    );

    if (!updatedProperty) {
      return res.status(404).send({ error: "Property not found" });
    }

    // Find the seller of the property
    const seller = await Seller.findById(updatedProperty.postedBy);

    // Define data here
    const data = {
      Name: seller.fullName,
      propertyName: updatedProperty.propertyTitle,
      PropertyType: updatedProperty.propertyType,
      Price: updatedProperty.price,
      TotalArea: updatedProperty.totalAcre,
      status: propertyApproval,
      propertyCode: updatedProperty.propertyCode,
      reason: reason,
    };

    // Send email to seller based on property approval status
    await sendMailToSeller(seller.email, data, propertyApproval);

    return res
      .status(200)
      .send({ success: "Status updated successfully", updatedProperty });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ error: "Something broke" });
  }
};

// delete a property from the property list
exports.deleteProperty = async (req, res) => {
  try {
    const isAdmin = await checkAdmin(req, res);
    // if (!isAdmin) {
    //   return;
    // }
    const { propertyId } = req.params;
    if (!propertyId)
      return res.status(500).send({ error: "Property not found" });

    const property = await Property.findOne({ _id: propertyId });
    if (!property) return res.status(400).send({ error: "Property not found" });

    // Remove property from its category instead of deleting
    const data = await Property.findOneAndUpdate(
      { _id: propertyId },
      { $set: { "propertyCategory.categoryId": null, "propertyCategory.status": false } },
      { new: true }
    );
    return res.status(200).send({ success: "Removed from category successfully", data });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ error: "Something broke" });
  }
};

exports.postProperty = async (req, res) => {
  try {
    const sellerId = req.params.sellerId;
    const { interested } = req.user;
    const payload = req.body;
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.send({ status: 422, errors: errors.array() });
    }

    let re = new RegExp("^(http|https)://", "i");
    let {
      images,
      videos,
      layoutMap,
      heroImage,
      categoryId,
      masterPlan,
      propertyAds,
      totalAcre,
      plotArea,
      isPropertyPromoted,
      logo,
      propertyPapers,
      maintainanceBills,
      daysAvailiblity,
      documentName,
      documentFile,
      alldaysAvailable,
      from,
      to,
      slots,
      city,
      priceMax,
      minArea,
      maxArea,
      pricePerMeter,
      pricePerYard,
      areaType,
      broucher,
      userInput,
      manageFarms,
      maintainaceOfYears,
      bathrooms,
      bedrooms,
      balconies,
      buildUpArea,
      floorDetails,
      ageOfProperty,
      transactionType,
      ownershipType,
      facing,
      facingRoadWidth,
      facingWidthType,
      bedroomsImages,
      bathroomsImages,
      exteriorViewImages,
      kitchenImages,
      floorPlanImages,
      farmhouseStatus,
      landmark,
    } = payload;

    const generateSlots = (from, to) => {
      const startTime = moment("08:00:00", "HH:mm:ss");
      const endTime = moment("22:00:00", "HH:mm:ss");
      const interval = 30; // 30 minutes interval
      const slots = [];
      const userFrom = moment(from, "HH:mm:ss");
      const userTo = moment(to, "HH:mm:ss");

      while (startTime.isBefore(endTime)) {
        const slotTime = startTime.format("HH:mm:ss");
        const isAvailable = startTime.isSameOrAfter(userFrom) && startTime.isBefore(userTo);
        slots.push({ slot: slotTime, available: isAvailable });
        startTime.add(interval, "minutes");
      }

      return slots;
    };

    if (from && to) {
      slots = generateSlots(from, to);
    }

    let imagesArray = [],
      layoutMapArray = [],
      masterPlanUrl = "",
      propertyAdsUrl = "",
      logoUrl = "",
      propertyPapersArray = [],
      maintainanceBillsArray = [],
      videosArray = [];
    let heroImageUrl = "";

    if (heroImage) {
      const heroImageResult = await uploadImage(heroImage);
      heroImageUrl = heroImageResult.Location;
    }
    if (logo) {
      const logoResult = await uploadImage(logo);
      logoUrl = logoResult.Location;
    }
    if (masterPlan) {
      const masterPlanResult = await uploadImage(masterPlan);
      masterPlanUrl = masterPlanResult.Location;
    }
    if (images && images.length) {
      for (let i = 0; i < images.length; i++) {
        const imageResult = await uploadImage(images[i]);
        imagesArray.push(imageResult.Location);
      }
    }

    if (maintainanceBills && maintainanceBills.length) {
      for (let i = 0; i < maintainanceBills.length; i++) {
        const maintainanceBillsResult = await uploadPDF(maintainanceBills[i]);
        maintainanceBillsArray.push(maintainanceBillsResult.Location);
      }
    }
    if (propertyPapers && propertyPapers.length) {
      for (let i = 0; i < propertyPapers.length; i++) {
        const propertyPapersResult = await uploadPDF(propertyPapers[i]);
        propertyPapersArray.push(propertyPapersResult.Location);
      }
    }

    if (videos && videos.length) {
      for (let i = 0; i < videos.length; i++) {
        if (!re.test(videos[i])) {
          const videoResult = await uploadVideo(videos[i]);
          videosArray.push(videoResult.Location);
        } else {
          videosArray.push(videos[i]);
        }
      }
    }

    if (layoutMap && layoutMap.length) {
      for (let i = 0; i < layoutMap.length; i++) {
        const layoutMapResult = await uploadImage(layoutMap[i]);
        layoutMapArray.push(layoutMapResult.Location);
      }
    }

    const propertyCode = uuidv4().slice(0, 8);
    let { price, plotLength, plotBreadth } = payload;
    let area = 0,
      pricePerSqft = 0;
    if (plotLength && plotBreadth) {
      area = Number(plotLength) * Number(plotBreadth);
      pricePerSqft = (Number(price) / area).toFixed(2);
    }

    // Logic to check and set category based on conditions
    if (categoryId) {
      const selectedCategory = await propertyCategoryModel.findById(categoryId);

      if (!selectedCategory) {
        return res.status(400).send({ status: 400, message: "Invalid category ID provided" });
      }

      if (/elite/i.test(selectedCategory.name)) {
        const categoryState = selectedCategory.city.map(c => c.city); // Extracting cities from category
        const categoryPrice = Number(selectedCategory.price);

        if (Number(price) < categoryPrice || !categoryState.includes(city)) {
          return res.status(400).send({
            status: 400,
            message: "Cannot add this property to the 'elite' category due to Price or City mismatch.",
          });
        }
      } else if (/(hot|highly)/i.test(selectedCategory.name)) {
        const shortlistCount = await Saved.countDocuments({ properties: payload._id, saved: true });
        const categoryShortlistCount = selectedCategory.shortlistCount;
        const categoryPropertyView = Number(selectedCategory.propertyView);
        const propertyView = payload.propertyView;

        if (propertyView < categoryPropertyView || shortlistCount < categoryShortlistCount) {
          return res.status(400).send({
            status: 400,
            message: "Cannot add this property to the 'Hot' or 'Highly' category due to less views or shortlist count mismatch.",
          });
        }
      }
    } else {
      const categories = await propertyCategoryModel.find();

      for (const category of categories) {
        if (/elite/i.test(category.name)) {
          const categoryState = category.city.map(c => c.city); // Extracting cities from category
          const categoryPrice = Number(category.price);

          if (Number(price) >= categoryPrice && categoryState.includes(city)) {
            categoryId = category._id;
            break;
          }
        } else if (/(hot|highly)/i.test(category.name)) {
          const shortlistCount = await Saved.countDocuments({ properties: payload._id, saved: true });
          const categoryShortlistCount = category.shortlistCount;
          const categoryPropertyView = Number(category.propertyView);
          const propertyView = payload.propertyView;

          if (propertyView >= categoryPropertyView && shortlistCount >= categoryShortlistCount) {
            categoryId = category._id;
            break;
          }
        }
      }
    }

    let data = {
      ...payload,
      propertyCode: propertyCode,
      postedBy: sellerId,
      images: imagesArray,
      videos: videosArray,
      masterPlan: masterPlanUrl,
      layoutMap: layoutMapArray,
      heroImage: heroImageUrl,
      isPropertyPromoted: isPropertyPromoted,
      propertyAds: propertyAdsUrl,
      logo: logoUrl,
      propertyPapers: propertyPapersArray,
      maintainanceBills: maintainanceBillsArray,
      documentName : documentName,
      documentFile : documentFile,
      daysAvailiblity,
      alldaysAvailable,
      from,
      to,
      slots: slots,
      priceMax : priceMax,
      minArea : minArea,
      maxArea : maxArea,
      pricePerMeter : pricePerMeter,
      pricePerYard : pricePerYard,
      areaType : areaType,
      broucher : broucher,
      userInput : userInput,
      manageFarms : manageFarms,
      maintainaceOfYears : maintainaceOfYears,
      bathrooms : bathrooms,
      bedrooms  : bedrooms,
      balconies : balconies,
      facing : facing,
      facingRoadWidth : facingRoadWidth,
      facingWidthType : facingWidthType,
      buildUpArea : buildUpArea,
      floorDetails : floorDetails,
      ageOfProperty : ageOfProperty,
      transactionType : transactionType,
      ownershipType : ownershipType,
      bedroomsImages : bedroomsImages,
      bathroomsImages : bathroomsImages,
      exteriorViewImages : exteriorViewImages,
      kitchenImages : kitchenImages,
      floorPlanImages : floorPlanImages,
      farmhouseStatus : farmhouseStatus,
      landmark: landmark,
      addBy : req.user._id,
    };

    if (categoryId) {
      data = {
        ...data,
        "propertyCategory.categoryId": categoryId,
        "propertyCategory.status": true,
      };
    }

    if (pricePerSqft > 0) {
      data = {
        ...data,
        pricePerSqft: pricePerSqft,
      };
    }

    if (req.user?._id) {
      data = {
        ...data,
        editBy: req.user._id,
      };
    }

    const dataToUpdate = await Property.create({ ...data });
    if (dataToUpdate) {
      // Additional operations after successful property creation
      await Seller.findOne({ _id: sellerId });
      await activityTrackerModel.findOneAndUpdate(
        { userId: sellerId },
        { $set: { propertyPostDate: moment(new Date()).format("DD-MM-YYYY") } }
      );
      return res.send({
        status: 201,
        message: "Property posted successfully",
        data: dataToUpdate,
      });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).send({ status: 500, message: err.message });
  }
};

// list of all enquiries
exports.enquiryList = async (req, res) => {
  try {
    let page = !req.query.page ? 1 : parseInt(req.query.page),
        limit = !req.query.limit ? 10 : parseInt(req.query.limit);
    let skip = (page - 1) * limit;
    let searchKey = req.query.search || "";
    let sort = req.query.sort || "newest";
    let sortBy = sort === "newest" ? { createdAt: -1 } : { createdAt: 1 };

    let query = {};

    // 🔍 Search functionality
    if (searchKey && searchKey.trim() !== "") {
      skip = 0;
      query = {
        ...query,
        $or: [
          { buyerName: { $regex: searchKey.trim(), $options: "si" } },
          { buyerEmail: { $regex: searchKey.trim(), $options: "si" } },
          { buyerPhone: { $regex: searchKey.trim(), $options: "si" } },
          { propertyTitle: { $regex: searchKey.trim(), $options: "si" } },
        ],
      };
    }

    // Total count for pagination
    let totalRecords = await enquiryModel.countDocuments(query).exec();

    // Fetch data with pagination
    let inquiryData = await enquiryModel
      .find(query)
      .sort(sortBy)
      .skip(skip)
      .limit(limit)
      .lean();

    // Format data for response
    const newData = inquiryData.map(e => ({
      _id: e._id,
      propertyId: e.propertyId,
      buyerId: e.buyerId,
      Customer: e.buyerName,
      Property: e.propertyTitle,
      propertyCode: e.propertyCode,
      Email: e.buyerEmail,
      mobileNumber: e.buyerPhone,
      status: e.status,
      reasonToBuy: e.reasonToBuy,
      preferredLocation: e.preferredLocation,
      budget: e.budget,
      homeLoanOptions: e.homeLoanOptions,
      siteVisits: e.siteVisits,
      termsAgreed: e.termsAgreed,
      createdAt: e.createdAt,
      updatedAt: e.updatedAt,
      formattedDate: moment(e.createdAt).format("MMMM DD, YYYY"),
    }));

    // Pagination meta
    const pageMeta = {
      total: totalRecords,
      skip: skip,
      pageSize: Math.ceil(totalRecords / limit),
    };

    res.send({
      status: 200,
      message: "Enquiry list",
      data: { data: newData, pageMeta },
    });

  } catch (err) {
    console.error(err);
    return res.status(500).send({ status: 500, message: err.message });
  }
};


// delete an enquiry
exports.deleteEnquiry = async (req, res) => {
  try {
    let { interested } = req.user;
    // if (interested !== "admin") {
    //   return res.status(403).send({ error: "You are not allowed" });
    // }
    let enquiryId = req.params._id;
    const enquiryData = await enquiryModel.findOne({ _id: enquiryId }).lean();
    if (!enquiryData) {
      return res.status(400).send({ error: "This enquiry does not exists" });
    }
    let isDeleted = await enquiryModel.findOneAndDelete({ _id: enquiryId });

    return res
      .status(200)
      .send({ message: "Enquiry deleted successfully", data: isDeleted });
  } catch (error) {
    return res.status(500).send({ status: 500, error: "Something broke" });
  }
};

exports.storeDeveloper = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(422)
        .json({ success: false, message: "error", response: errors.array() });
    }

    let { email, password, phone, interested, fullName, i_am } = req.body;

    email = email.toLowerCase();

    const salt = bcrypt.genSaltSync(parseInt(process.env.SALT));

    const hashPassword = bcrypt.hashSync(password, salt);

    const { token: verificationToken, expiresAt } = generateVerificationToken();

    const createAccount = await Seller.create({
      email,
      password: hashPassword,
      fullName,
      phone,
      interested,
      i_am,
      verificationToken,
      verificationTokenExpiresAt: expiresAt,
      isAccountVerified: true,
    });

    if (!createAccount) {
      return res
        .status(500)
        .json({ success: false, message: "Failed to create account" });
    }

    try {
      const data = {
        Name: fullName,
        verificationToken,
      };
      await sendEmailSign(email, data, "verify", `Verify Your Account`);
    } catch (error) {
      return res
        .status(500)
        .json({ success: false, message: "error", response: error.message });
    }
    return res.status(201).json({
      success: true,
      message: "Account created successfully. Verification email sent.",
      response: createAccount,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "error", response: error.message });
  }
};

exports.updateDeveloperProfile = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    const userId = req.body.userId;
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
      password,
    } = req.body;

    // return res.status(400).json({ success: userId });
    // Check if userId is valid
    if (!userId) {
      return res
        .status(400)
        .json({ success: false, message: "User ID is missing" });
    }

    // Find user by ID
    const user = await Seller.findById(userId);

    // Check if user exists
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const salt = bcrypt.genSaltSync(parseInt(process.env.SALT));
    const hashPassword = bcrypt.hashSync(password, salt);

    const existingEmail = await Seller.findOne({
      email: email,
      _id: { $ne: userId },
    });
    // if (existingEmail) {
    //   return res
    //     .status(400)
    //     .json({ success: false, message: "Email already exists" });
    // }

    // Check if the phone number exists for another user
    const existingPhone = await Seller.findOne({
      phone: phone,
      _id: { $ne: userId },
    });
    // if (existingPhone) {
    //   return res
    //     .status(400)
    //     .json({ success: false, message: "Phone number already exists" });
    // }

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
    }

    if (companyName) {
      const existingCompany = await Seller.findOne({
        companyName: { $regex: new RegExp(`^${companyName}$`, "i") },
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
    if(password){
      user.password = hashPassword;
    }
    await user.save();

    // Respond with success message
    return res.status(200).json({
      success: true,
      message: "Profile updated successfully.",
      response: user,
    });
  } catch (error) {
    // Log the error
    console.error("Error updating developer profile:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

// exports.getDevelopersList = async (req, res) => {
//   try {
//     let page = parseInt(req.query.page);
//     let limit = parseInt(req.query.limit);
//     let startIndex = (page - 1) * limit;

//     let sort = req.query.sort || "";
//     let order = req.query.order || "";

//     let sortOrder = {}

//     if(order === "ascending"){
//       sortOrder = {[sort] : 1}
//     }else if(order === "descending"){
//       sortOrder = {[sort] : -1}
//     }else{
//       sortOrder = {createdAt : -1}
//     }

//     const search = req.query.search || "";
//     let searchQuery = search
//       ? {
//           $or: [
//             {
//               fullName: { $regex: new RegExp(`^${search}`), $options: "si" },
//             },
//             {
//               companyName: { $regex: new RegExp(`^${search}`), $options: "si" },
//             },
//             {
//               email: { $regex: new RegExp(`^${search}`), $options: "si" },
//             },
//             { phone: { $regex: new RegExp(search), $options: "si" } },
//           ],
//         }
//       : {};

//     const count = await Seller.countDocuments(searchQuery);
//     const developers = await Seller.find(
//       searchQuery,
//       "-password -verificationToken -verificationTokenExpiresAt"
//     )
//       .skip(startIndex)
//       .limit(limit)
//       .sort(sortOrder)

      
//      // Find total projects for each developer
//      const developersWithProjects = await Promise.all(
//       developers.map(async (developer) => {
//         const totalProjects = await Property.countDocuments({ postedBy: developer._id });
//         const completedProjects = await Property.countDocuments({ postedBy: developer._id, propertyStatus : "sold-out" });
//         const ongoingProjects = await Property.countDocuments({ postedBy: developer._id, propertyStatus : "available" });
//         return {
//           ...developer.toObject(),
//           totalProjects,
//           completedProjects,
//           ongoingProjects
//         };
//       })
//     );

//     // Return the list of developers as a JSON response
//     return res.status(200).json({
//       success: true,
//       message: "Developers List.",
//       response: developersWithProjects,
//       counts: count,
//     });
//   } catch (error) {
//     // Handle any errors that occur during the process
//     return res
//       .status(500)
//       .json({ success: false, message: "error", response: error.message });
//   }
// };

exports.getDevelopersList = async (req, res) => {
  try {
    let page = parseInt(req.query.page) 
    let limit = parseInt(req.query.limit) 
    let startIndex = (page - 1) * limit;

    let sort = req.query.sort || "createdAt";
    let order = req.query.order || "descending";

    let sortOrder = order === "ascending" ? 1 : -1;
    let sortQuery = { [sort]: sortOrder };

    const filter = req.query.i_am || "";
    let filteri_amStatus = {};
    if (filter) {
      if (filter === "developer" || filter === "owner") {
        filteri_amStatus = { i_am: filter };
      } else {
        return res.status(400).send({ error: "Invalid filter value" });
      }
    }

    const subscription = req.query.subscription;
    let subscriptionFilter = {};
    if (subscription !== undefined) {
      if (subscription === "true") {
        subscriptionFilter = { subscription: true };
      } else if (subscription === "false") {
        subscriptionFilter = { $or: [{ subscription: false }, { subscription: null }] };
      } 
    }

    const featured = req.query.featured;
    let featuredFilter = {};
    if (featured !== undefined) {
      if (featured === "true") {
        featuredFilter = { featured: true };
      } else if (featured === "false") {
        featuredFilter = { $or: [{ featured: false }, { featured: null }] };
      }
    }

    const search = req.query.search || "";
    let searchQuery = search
      ? {
          $or: [
            { fullName: { $regex: new RegExp(search), $options: "si" } },
            { companyName: { $regex: new RegExp(search), $options: "si" } },
            { email: { $regex: new RegExp(`^${search}`, "si") } },
            { phone: { $regex: new RegExp(search, "si") } },
          ],
        }
      : {};

    const combinedQuery = { ...filteri_amStatus, ...subscriptionFilter, ...featuredFilter, ...searchQuery, interested : "sell" };
    
    const count = await Seller.countDocuments(combinedQuery);
    const developers = await Seller.find(combinedQuery, "-profilePic -logo -password -verificationToken -verificationTokenExpiresAt")
      .skip(startIndex)
      .limit(limit)
      .sort(sortQuery);

    const developersWithProjects = await Promise.all(
      developers.map(async (developer) => {
        const ongoingProjects = await Property.countDocuments({ postedBy: developer._id, status : "publish" });
        // const completedProjects = await Property.countDocuments({ postedBy: developer._id, status : "publish", propertyStatus: "sold-out" });
        // const ongoingProjects = await Property.countDocuments({ postedBy: developer._id, status : "publish", propertyStatus: "available" });

      // Fetch seller subscription details
      const sellerSubscription = await sellerSubModel.findOne({ id: developer._id });

        return {
          ...developer.toObject(),
          ongoingProjects,
          // completedProjects,
          // ongoingProjects
          sellerSubscription: sellerSubscription
            ? {
                id: sellerSubscription.id,
                expiresAt: sellerSubscription.expiresAt,
                plan: sellerSubscription.plan,
                planId: sellerSubscription.planId,
                timePeriod: sellerSubscription.timePeriod,
                price: sellerSubscription.price,
                isActive: sellerSubscription.isActive,
              }
            : null, 
        };
      })
    );

    return res.status(200).json({
      success: true,
      message: "Developers List.",
      response: developersWithProjects,
      counts: count,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Error fetching developers list", response: error.message });
  }
};


// user creation by admin
exports.userCreate = async (req, res) => {
  try {
    let userId = req.user?._id
  
    let { username, email, password, phone, ...rest } = req.body;

    email = email.toLowerCase();

    const encryptedPass = encrypt(password);

    const createAccount = await usersModel.create({
      email,
      password: encryptedPass,
      username,
      phone,
      isAccountVerified: true,
      admin: userId,
      ...rest,
    });

    if (!createAccount) {
      return res
        .status(500)
        .json({ success: false, message: "Failed to create account" });
    }
    return res.status(201).json({
      success: true,
      message: "Account created successfully.",
      response: createAccount,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ status: 500, message: error.message });
  }
};

// activate or deactivate user
exports.toggleUserStatus = async (req, res) => {
  try {
    const { interested } = req.user;

    // if (interested && interested !== "admin") {
    //   return res.status(400).send({ error: "You are not allowed" });
    // }
    let msgValue = "";

    const { userId } = req.params;
    const currentUserStatus = await usersModel
      .findOne({ _id: userId })
      .select({ status: 1, _id: 0 })
      .lean();

    if (currentUserStatus) {
      let currentStatus = currentUserStatus.status;
      if (currentStatus) {
        currentStatus = false;
        msgValue = "deactivated";
      } else {
        currentStatus = true;
        msgValue = "activated";
      }
      let data = await usersModel
        .findOneAndUpdate(
          { _id: userId },
          { $set: { status: currentStatus } },
          { new: true }
        )
        .lean();
      if (data) {
        return res.status(200).send({
          success: true,
          message: `User account ${msgValue}`,
          response: data,
        });
      }
    } else {
      return res.status(200).send({
        success: false,
        message: "Failed to activate or deactivate user account",
      });
    }
  } catch (error) {
    return res.status(500).send({ status: 500, message: error.message });
  }
};

// view user details
exports.userDetails = async (req, res) => {
  try {
    const { userId } = req.params;

    const userData = await usersModel
      .findOne({ _id: userId })
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
    return res.status(500).send({ status: 500, message: error.message });
  }
};

// delete a user
exports.deleteUser = async (req, res) => {
  try {
    const { interested } = req.user;
    const { userId } = req.params;
    const userData = await usersModel.findOne({ _id: userId }).lean();
    if (!userData) {
      return res.status(404).send({ status: 404, message: "User not found" });
    }
    const deleteUser = await usersModel.findOneAndDelete({ _id: userId });
    if (deleteUser) {
      return res
        .status(200)
        .send({ success: true, message: "User deleted successfully" });
    } else {
      return res
        .status(409)
        .send({ success: false, message: "Failed to delete User" });
    }
  } catch (error) {
    return res.status(500).send({ status: 500, message: error.message });
  }
};

// delete a user
exports.assignUserRoles = async (req, res) => {
  try {
    const { interested } = req.user;
    const { userId } = req.params;
    const userData = await usersModel.findOne({ _id: userId }).lean();
    if (!userData) {
      return res.status(404).send({ status: 404, message: "User not found" });
    }
    const dataToUpdate = req.body;

    const updateRole = await usersModel.findOneAndUpdate(
      { _id: userId },
      { $set: { ...dataToUpdate } },
      { new: true }
    );
    if (updateRole) {
      return res.status(200).send({
        success: true,
        message: "User permissions updated successfully",
        response: updateRole,
      });
    } else {
      return res
        .status(400)
        .send({ success: false, message: "Failed to update user permissions" });
    }
  } catch (error) {
    return res.status(500).send({ status: 500, message: error.message });
  }
};

// user management system api
exports.userManagement = async (req, res) => {
  try {
    const { interested } = req.user;

    // if (interested && interested !== "admin") {
    //   return res.status(400).send({ error: "You are not allowed" });
    // }

    let page = !req.query.page ? 1 : parseInt(req.query.page),
      limit = !req.query.limit ? 10 : parseInt(req.query.limit);
    let skip = (page - 1) * limit;
    let search = req.query.search || "";
    let query = {};

    if (search && search !== undefined && search !== "" && search !== " ") {
      (skip = 0),
        (query = {
          ...query,
          username: { $regex: search.trim(), $options: "si" },
          email: { $regex: search.trim(), $options: "si" },
        });
    }
    const usersList = await usersModel
      .find({ ...query })
      .sort({ _id: -1 })
      .select({ __v: 0 })
      .skip(skip)
      .limit(limit)
      .lean();

    if (usersList.length) {
      return res
        .status(200)
        .send({ success: true, message: "Users list", response: usersList });
    } else {
      return res
        .status(200)
        .send({ success: true, message: "Users list", response: [] });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).send({ status: 500, message: error.message });
  }
};

exports.editUser = async (req, res) => {
  try {
    let adminId = req.user?._id
    const { userId } = req.params;
    const userData = await usersModel.findOne({ _id: userId }).lean();
    if (!userData) {
      return res.status(404).send({ error: "User not found" });
    }

    let oldId = userData?._id;
    let { email, phone, password, username, ...rest } = req.body;

    // let hashPassword = "";

    let checkUser = await usersModel
      .findOne({
        $or: [{ email: email }, { phone: phone }],
        _id: { $ne: oldId },
      })
      .lean();
    if (checkUser) {
      return res.status(400).send({ error: "User already exists" });
    }

    let dataToUpdate = {
      email,
      username,
      phone,
      ...rest,
    };

    if (password) {
      const encryptedPass = encrypt(password);

      dataToUpdate = {
        ...dataToUpdate,
        password: encryptedPass,
      };
    }

    const isUpdated = await usersModel.updateOne(
      { _id: userId },
      { $set: { ...dataToUpdate, admin: adminId } },
      { new: true }
    );

    if (isUpdated) {
      return res.status(200).send({
        status: 200,
        message: "User updated successfully",
        response: isUpdated,
      });
    } else {
      return res
        .status(409)
        .send({ status: 409, message: "Failed to update users data" });
    }
  } catch (error) {
    return res.status(500).send({ status: 500, message: error.message });
  }
};

exports.createPropertyCategory = async (req, res) => {
  try {
    let adminId = req.user._id
    const { interested } = req.user;

    const { name, description, order, price, city, propertyView, shortlistCount, days, count } = req.body;
    const categoryName = name.toLowerCase();

    // Check if the provided order already exists for another category
    const existingCategoryWithOrder = await propertyCategoryModel
      .findOne({ order })
      .lean();

    if (existingCategoryWithOrder) {
      // If the order already exists, find the maximum order currently used
      const maxOrderCategory = await propertyCategoryModel
        .findOne({}, { order: 1 }, { sort: { order: -1 } })
        .lean();

      // Increment the order by 1 for the new category
      const newOrder = maxOrderCategory
        ? parseInt(maxOrderCategory.order) + 1
        : 1;

      // Update the order of the existing category
      await propertyCategoryModel.updateOne(
        { _id: existingCategoryWithOrder._id },
        { $set: { order: newOrder.toString() } }
      );

      // Create the new category with the provided order
      const isCreated = await propertyCategoryModel.create({
        name,
        categoryName,
        order,
        description: description ? description : "",
        admin: adminId,
        price,
        city,
        propertyView,
        shortlistCount,
        days,
        count
      });

      if (isCreated) {
        return res.status(201).send({
          status: 201,
          message: "Property Category added successfully",
          response: isCreated,
        });
      } else {
        return res
          .status(409)
          .send({ status: 409, error: "Failed to add property category" });
      }
    } else {
      // If the order doesn't exist for any other category, create the new category with the provided order
      const isCreated = await propertyCategoryModel.create({
        name,
        categoryName,
        order,
        description: description ? description : "",
        admin: adminId,
        price,
        city,
        propertyView,
        shortlistCount,
        days,
        count
      });

      if (isCreated) {
        return res.status(201).send({
          status: 201,
          message: "Property Category added successfully",
          response: isCreated,
        });
      } else {
        return res
          .status(409)
          .send({ status: 409, error: "Failed to add property category" });
      }
    }
  } catch (error) {
    return res.status(500).send({ status: 500, message: error.message });
  }
};

// property category listing
exports.getPropertyCategoryList = async (req, res) => {
  try {
    const categoryList = await propertyCategoryModel
      .find(
        // $and: [
        //   { name: { $not: { $regex: /newly|new|recently|latest/i } } }, // Case-insensitive regex to exclude categories
          // { visible: true } // Assuming visible is a field indicating if the category should be included
        //]
      )
      .select({ name: 1, visible: 1, order: 1, price: 1, city: 1, propertyView: 1, shortlistCount: 1, days: 1, count: 1 })
      .lean();

    return res.status(200).send({
      status: 200,
      message: "Property Category list",
      response: categoryList,
    });
  } catch (error) {
    return res.status(500).send({ status: 500, message: error.message });
  }
};


exports.categoryList = async (req, res) => {
  try {
    let search = req.query.search || "";
    let query = {};

    if (search && search !== "" && search !== undefined && search !== " ") {
      query = {
        categoryName: { $regex: search.trim(), $options: "si" },
      };
    }
    let data = await Property.aggregate([
      { $match: { propertyCategory: { $exists: true } } },
      {
        $project: {
          categoryId: "$propertyCategory.categoryId",
          _id: 0,
        },
      },
      {
        $lookup: {
          from: "propertycategories",
          localField: "categoryId",
          foreignField: "_id",
          as: "categories",
        },
      },
      { $unwind: "$categories" },
      {
        $group: {
          _id: "$categories._id",
          count: { $sum: 1 },
          categoryName: { $first: "$categories.name" },
          visible: { $first: "$categories.visible" },
          description: { $first: "$categories.description" },
        },
      },
      { $match: { ...query } },
    ]);

    return res.status(200).send({
      status: 200,
      message: "Property Category list",
      response: data,
    });
  } catch (error) {
    return res.status(500).send({ status: 500, message: error.message });
  }
};
exports.propertyListByCategoryId = async (req, res) => {
  try {
    let categoryId = req.params.categoryId;

    if (categoryId !== undefined && categoryId !== "" && categoryId !== null) {
      categoryId = new mongoose.Types.ObjectId(categoryId);
    }
    let page = !req.query.page ? 1 : parseInt(req.query.page),
      limit = !req.query.limit ? 10 : parseInt(req.query.limit);
    let skip = (page - 1) * limit;
    let search = req.query.search || "";
    let propertyTypeFilter = req.query.propertyTypeFilter || "";
    let availabilityFilter = req.query.availabilityFilter || "";
    let query = {};

    if (search && search !== "" && search !== undefined && search !== " ") {
      (skip = 0),
        (query = {
          ...query,
          propertyTitle: { $regex: search.trim(), $options: "si" },
          propertyType: { $regex: search.trim(), $options: "si" },
        });
    }
    if (
      propertyTypeFilter &&
      propertyTypeFilter !== "" &&
      propertyTypeFilter !== undefined &&
      propertyTypeFilter !== " "
    ) {
      query = {
        ...query,
        propertyType: propertyTypeFilter,
      };
    }
    if (
      availabilityFilter &&
      availabilityFilter !== "" &&
      availabilityFilter !== undefined &&
      availabilityFilter !== " "
    ) {
      query = {
        ...query,
        propertyStatus: availabilityFilter,
      };
    }
    query = {
      ...query,
      propertyCategory: { $exists: true },
      "propertyCategory.categoryId": categoryId,
    };
   
    let totalRecords = await Property.countDocuments({ ...query }).exec();

    let data = await Property.aggregate([
      { $match: { ...query } },
      {$skip : skip},
      {$limit : limit},
      {
        $project: {
          categoryId: "$propertyCategory.categoryId",
          propertyTitle: 1,
          propertyType: 1,
          plotArea: 1,
          price: 1,
          heroImage: 1,
          logo: 1,
          propertyStatus: 1,
        },
      },
      {
        $lookup: {
          from: "propertycategories",
          localField: "categoryId",
          foreignField: "_id",
          as: "categories",
        },
      },
      { $unwind: "$categories" },
      {
        $project: {
          propertyTitle: 1,
          propertyType: 1,
          plotArea: 1,
          price: 1,
          heroImage: 1,
          logo: 1,
          propertyStatus: 1,
          categoryId: "$categories._id",
          categoryName: "$categories.name",
          visible: "$categories.visible",
          description: "$categories.description",
        },
      },
      // { $match: { ...query } },
    ]);

    let pageMeta = {};
    if (Property.length) {
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
    return res.status(200).send({
      status: 200,
      message: "Property Category list",
      response: { data: data, pageMeta: pageMeta },
     
    });
  } catch (error) {
    return res.status(500).send({ status: 500, message: error.message });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const { interested } = req.user;
    const { categoryId } = req.params;
    if (!categoryId) {
      res.status(400).send({ error: "CategoryId is required" });
    }
    const categoryName = await propertyCategoryModel
      .findOne({ _id: categoryId })
      .select({ name: 1 })
      .lean();

    if (!categoryName) {
      res.status(404).send({ error: "Property category not found" });
    }

    if (categoryName) {
      const updateProperties = await Property.updateMany(
        { "propertyCategory.categoryId": categoryId },
        {
          $set: {
            propertyCategory: {},
          },
        }
      );
      await propertyCategoryModel.findOneAndDelete({ _id: categoryId });

      if (updateProperties) {
        return res.status(200).send({
          status: 200,
          message: "Property category deleted successfully",
        });
      }
    }
  } catch (error) {
    console.log(error);
    return res.status(500).send({ status: 500, message: error.message });
  }
};

// change category visibility
exports.categoryVisibility = async (req, res) => {
  try {
    const { interested } = req.user;
    const categoryId = req.params.categoryId;

    if (!categoryId) {
      res.status(400).send({ error: "CategoryId is required" });
    }
    let currentVisibility = await propertyCategoryModel
      .findOne({ _id: categoryId })
      .select({ visible: 1 })
      .lean();

    if (currentVisibility) {
      const toggle = currentVisibility.visible ? false : true;
      const updateVisible = await propertyCategoryModel.findByIdAndUpdate(
        { _id: categoryId },
        { $set: { visible: toggle } },
        { new: true }
      );
      if (updateVisible) {
        const updateProperties = await Property.updateMany(
          { "propertyCategory.categoryId": categoryId },
          {
            $set: {
              "propertyCategory.status": toggle,
            },
          }
        );

        if (updateProperties) {
          return res.status(200).send({
            status: 200,
            message: "Property Category updated successfully",
            response: updateVisible,
          });
        } else {
          return res.status(400).send({
            error: "Failed to update property category",
          });
        }
      } else {
        return res.status(400).send({
          status: 400,
          message: "Failed to update property category",
        });
      }
    } else {
      return res.status(404).send({ error: "Property category not found" });
    }
  } catch (error) {
    return res.status(500).send({ status: 500, message: error.message });
  }
};

exports.editPropertyCategory = async (req, res) => {
  try {
    const { interested } = req.user;
    const categoryId = req.params.categoryId;
    const category = await propertyCategoryModel
      .findOne({ _id: categoryId })
      .lean();

    if (!category) {
      return res.status(404).send({ error: "Property category not found" });
    }

    const { name, description, order, price, city, propertyView, shortlistCount, days, count } = req.body;
    const categoryName = name ? name.toLowerCase() : "";

    const checkIfNameExists = await propertyCategoryModel
      .findOne({ categoryName })
      .lean();

    if (checkIfNameExists && checkIfNameExists._id.toString() !== categoryId) {
      return res
        .status(400)
        .send({ error: "Property category already exists" });
    }

    let dataToUpdate = {};
    if (name) {
      dataToUpdate = {
        ...dataToUpdate,
        name,
        categoryName,
      };
    }
    if (description) {
      dataToUpdate = {
        ...dataToUpdate,
        description,
      };
    }
    if (price) {
      dataToUpdate = {
        ...dataToUpdate,
        price,
      };
    }
    if (city) {
      dataToUpdate = {
        ...dataToUpdate,
        city,
      };
    }
    if (propertyView) {
      dataToUpdate = {
        ...dataToUpdate,
        propertyView,
      };
    }
    if (shortlistCount) {
      dataToUpdate = {
        ...dataToUpdate,
        shortlistCount,
      };
    }
    if (days) {
      dataToUpdate = {
        ...dataToUpdate,
        days,
      };
    }
    if (count) {
      dataToUpdate = {
        ...dataToUpdate,
        count,
      };
    }
    if (order && order !== category.order) {
      // Check if the provided order already exists for another category
      const existingCategoryWithOrder = await propertyCategoryModel
        .findOne({ order })
        .lean();

      if (existingCategoryWithOrder) {
        // If the order already exists, find the category to assign this order
        const categoryToAssignOrder =
          await propertyCategoryModel.findOneAndUpdate(
            { order },
            { $set: { order: category.order } },
            { new: true }
          );

        // Assign the order to the category which user wants to assign
        if (categoryToAssignOrder) {
          dataToUpdate.order = order;
        } else {
          return res
            .status(400)
            .send({ error: "Failed to update category orders" });
        }
      }
    }

    const isUpdated = await propertyCategoryModel.findOneAndUpdate(
      { _id: categoryId },
      { $set: { ...dataToUpdate } },
      { new: true }
    );

    if (isUpdated) {
      return res.status(200).send({
        message: "Category updated successfully",
        response: isUpdated,
      });
    } else {
      return res.status(400).send({
        error: "Failed to update category",
      });
    }
  } catch (error) {
    return res.status(500).send({ status: 500, message: error.message });
  }
};

//property move to a different category
exports.propertyCategoryUpdate = async (req, res) => {
  try {
    const { interested } = req.user;
    const { oldCategoryId, newCategoryId, propertyId, visible } = req.body;

    const category = await propertyCategoryModel
      .findOne({ _id: oldCategoryId })
      .lean();
    if (!category) {
      return res.status(404).send({ error: "Property category not found" });
    }
    const categoryupdate = await Property.updateMany(
      { _id: propertyId },
      {
        $set: { "propertyCategory.categoryId": newCategoryId, status: visible },
      }
    );
    if (categoryupdate) {
      return res.status(200).send({
        status: 200,
        message: "Property category updated",
        response: categoryupdate,
      });
    } else {
      return res.status(400).send({
        error: "Property category updated",
      });
    }
  } catch (error) {
    return res.status(500).send({ status: 500, message: error.message });
  }
};

exports.getAdminDashboard = async (req, res) => {
  try {
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

        if (isNaN(calculatedStartDate.getTime()) || isNaN(calculatedEndDate.getTime())) {
          return res.status(400).send({ error: "Invalid date format" });
        }

        days = Math.ceil((calculatedEndDate - calculatedStartDate) / (1000 * 60 * 60 * 24));
      }

      comparisonFilter = { createdAt: { $gte: calculatedStartDate, $lt: calculatedEndDate } };

      // Calculate the previous period's date range
      const previousPeriodEndDate = new Date(calculatedStartDate);
      const previousPeriodStartDate = new Date(previousPeriodEndDate);
      previousPeriodStartDate.setDate(previousPeriodStartDate.getDate() - days);

      dateFilter = { createdAt: { $gte: previousPeriodStartDate, $lt: previousPeriodEndDate } };
    }

     // Default period filters if no specific period is applied
    const currentMonthStart = moment().startOf("month");
    const lastMonthStart = moment().subtract(1, "months").startOf("month");

    const totalPropertiesThisPeriod = days > 0 || period === "custom"
    ? await Property.countDocuments(comparisonFilter)
    : await Property.countDocuments({ createdAt: { $gte: currentMonthStart.toDate() } });

    const totalPropertiesLastPeriod = days > 0 || period === "custom"
    ? await Property.countDocuments(dateFilter)
    : await Property.countDocuments({ createdAt: { $gte: lastMonthStart.toDate(), $lt: currentMonthStart.toDate() } });

    const totalPropertiesAllTime = days > 0 || period === "custom"
      ? totalPropertiesThisPeriod 
      : await Property.countDocuments({});

    const totalPropertiesPercentageChange = totalPropertiesLastPeriod !== 0
      ? ((totalPropertiesThisPeriod - totalPropertiesLastPeriod) / totalPropertiesLastPeriod) * 100
      : totalPropertiesThisPeriod > 0 ? 100 : 0;

    const totalPropertiesStatus = totalPropertiesThisPeriod > totalPropertiesLastPeriod ? "up" : "down";

    const propertiesSoldThisPeriod = days > 0 || period === "custom"
    ? await Property.countDocuments({ propertyStatus: "sold-out", ...comparisonFilter })
    : await Property.countDocuments({ propertyStatus: "sold-out", createdAt: { $gte: currentMonthStart.toDate() } });

    const propertiesSoldLastPeriod = days > 0 || period === "custom"
    ? await Property.countDocuments({ propertyStatus: "sold-out", ...dateFilter })
    : await Property.countDocuments({propertyStatus: "sold-out", createdAt: { $gte: lastMonthStart.toDate(), $lt: currentMonthStart.toDate() } });

    const totalSoldPropertiesAllTime = days > 0 || period === "custom"
      ? propertiesSoldThisPeriod 
      : await Property.countDocuments({propertyStatus: "sold-out"});


    const propertiesSoldPercentageChange = propertiesSoldLastPeriod !== 0
      ? ((propertiesSoldThisPeriod - propertiesSoldLastPeriod) / propertiesSoldLastPeriod) * 100
      : propertiesSoldThisPeriod > 0 ? 100 : 0;

    const propertiesSoldStatus = propertiesSoldThisPeriod > propertiesSoldLastPeriod ? "up" : "down";

    const totalSellersThisPeriod = days > 0 || period === "custom"
    ? await Seller.countDocuments({ interested: "sell", ...comparisonFilter })
    : await Seller.countDocuments({interested: "sell", createdAt: { $gte: currentMonthStart.toDate() } });

    const totalSellersLastPeriod = days > 0 || period === "custom"
    ? await Seller.countDocuments({ interested: "sell", ...dateFilter })
    : await Seller.countDocuments({interested: "sell", createdAt: { $gte: lastMonthStart.toDate(), $lt: currentMonthStart.toDate() } });

    const totalSellersAllTime = days > 0 || period === "custom"
      ? totalSellersThisPeriod 
      : await Seller.countDocuments({interested: "sell"});

    const totalSellersPercentageChange = totalSellersLastPeriod !== 0
      ? ((totalSellersThisPeriod - totalSellersLastPeriod) / totalSellersLastPeriod) * 100
      : totalSellersThisPeriod > 0 ? 100 : 0;

    const totalSellersStatus = totalSellersThisPeriod > totalSellersLastPeriod ? "up" : "down";

    const totalBuyersThisPeriod = days > 0 || period === "custom"
    ? await Seller.countDocuments({ interested: "buy", ...comparisonFilter })
    : await Seller.countDocuments({interested: "buy", createdAt: { $gte: currentMonthStart.toDate() } });

    const totalBuyersLastPeriod = days > 0 || period === "custom"
    ? await Seller.countDocuments({ interested: "buy", ...dateFilter })
    : await Seller.countDocuments({interested: "buy", createdAt: { $gte: lastMonthStart.toDate(), $lt: currentMonthStart.toDate() } });

    const totalBuyersAllTime = days > 0 || period === "custom"
      ? totalBuyersThisPeriod 
      : await Seller.countDocuments({interested: "buy"});

    const totalBuyersPercentageChange = totalBuyersLastPeriod !== 0
      ? ((totalBuyersThisPeriod - totalBuyersLastPeriod) / totalBuyersLastPeriod) * 100
      : totalBuyersThisPeriod > 0 ? 100 : 0;

    const totalBuyersStatus = totalBuyersThisPeriod > totalBuyersLastPeriod ? "up" : "down";

    const activePropertiesThisPeriod = await Property.countDocuments({
      propertyApproval: "Resolved",
      propertyStatus: "available",
      ...comparisonFilter,
    });

    const activePropertiesLastPeriod = await Property.countDocuments({
      propertyApproval: "Resolved",
      propertyStatus: "available",
      ...dateFilter,
    });

    const activePropertiesPercentageChange = activePropertiesLastPeriod !== 0
      ? ((activePropertiesThisPeriod - activePropertiesLastPeriod) / activePropertiesLastPeriod) * 100
      : activePropertiesThisPeriod > 0 ? 100 : 0;

    const activePropertiesStatus = activePropertiesThisPeriod > activePropertiesLastPeriod ? "up" : "down";

    const totalInquiryThisPeriod = days > 0 || period === "custom"
    ? await enquiryModel.countDocuments(comparisonFilter)
    : await enquiryModel.countDocuments({createdAt: { $gte: currentMonthStart.toDate() } });

    const totalInquiryLastPeriod = days > 0 || period === "custom"
    ? await enquiryModel.countDocuments(dateFilter)
    : await enquiryModel.countDocuments({createdAt: { $gte: lastMonthStart.toDate(), $lt: currentMonthStart.toDate() } });

    const totalInquiriesAllTime = days > 0 || period === "custom"
      ? totalInquiryThisPeriod 
      : await enquiryModel.countDocuments();

    const totalInquiryPercentageChange = totalInquiryLastPeriod !== 0
      ? ((totalInquiryThisPeriod - totalInquiryLastPeriod) / totalInquiryLastPeriod) * 100
      : totalInquiryThisPeriod > 0 ? 100 : 0;

    const totalInquiryStatus = totalInquiryThisPeriod > totalInquiryLastPeriod ? "up" : "down";

    const propertyCounts = await Property.aggregate([
      {
        $match: comparisonFilter, 
      },
      {
          $group: {
              _id: "$addBy", 
              count: { $sum: 1 } 
          }
      }
  ]); 

  let developersCount = 0;
  let adminCount = 0;
  let userPropertyCounts = []; 

  for (const property of propertyCounts) {
      const seller = await Seller.findOne({ _id: property._id });
      const user = await usersModel.findOne({ _id: property._id });

      if (seller) {
          if (seller.interested === "sell") {
              developersCount += property.count;
          } else if (seller.interested === "admin") {
              adminCount += property.count;
          }
      } else if (user) {
          userPropertyCounts.push([user.username, property.count]);
      }
  }

  // Add developers and admin counts to the array
  userPropertyCounts.push(["developers", developersCount]);
  userPropertyCounts.push(["admin", adminCount]);

    const sortOrder = { createdAt: -1, customCreatedAt: -1 };

    const recentlyAddedProperty = await Property.find()
      .populate({
        path: "postedBy",
        model: "sellers",
        select: '-logo -profilePic -about -i_am -city -companyName -totalProjects -ongoingProjects -completedProjects -website -i_am -city -companyName -address -notification -verificationTokenExpiresAt',
      })
      .sort(sortOrder)
      .limit(5);

    return res.status(200).send({
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
          thisPeriod: propertiesSoldThisPeriod,
          lastPeriod: propertiesSoldLastPeriod,
          alltime: totalSoldPropertiesAllTime,
          change: propertiesSoldPercentageChange,
          status: propertiesSoldStatus,
        },
        totalSellers: {
          thisPeriod: totalSellersThisPeriod,
          lastPeriod: totalSellersLastPeriod,
          alltime: totalSellersAllTime,
          change: totalSellersPercentageChange,
          status: totalSellersStatus,
        },
        totalBuyers: {
          thisPeriod: totalBuyersThisPeriod,
          lastPeriod: totalBuyersLastPeriod,
          alltime: totalBuyersAllTime,
          change: totalBuyersPercentageChange,
          status: totalBuyersStatus,
        },
        activeProperties: {
          thisPeriod: activePropertiesThisPeriod,
          lastPeriod: activePropertiesLastPeriod,
          change: activePropertiesPercentageChange,
          status: activePropertiesStatus,
        },
        inquiry: {
          thisPeriod: totalInquiryThisPeriod,
          lastPeriod: totalInquiryLastPeriod,
          alltime: totalInquiriesAllTime ,
          change: totalInquiryPercentageChange,
          status: totalInquiryStatus,
        },
        data : userPropertyCounts,
        recentProperties: recentlyAddedProperty,
      },
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      error: error.message,
    });
  }
};


exports.sellerMinifiedList = async (req, res) => {
  try {
    const sellers = await Seller.find({
      //profileCompleted: true,
      interested: "sell"
    }).select('_id companyName');

    // Filter out sellers with no companyName or an empty companyName
    const filteredSellers = sellers.filter(seller => seller.companyName && seller.companyName.trim() !== '');

    // Map the result to rename `companyName` to `fullName` and include subscription details
    const modifiedSellers = await Promise.all(filteredSellers.map(async (seller) => {
      const sellerSubscription = await sellerSubModel.findOne({ id: seller._id });
      return {
        _id: seller._id,
        fullName: seller.companyName,
        subscription:seller.subscription,
        sellerSubscription: sellerSubscription
          ? {
              id: sellerSubscription.id,
              expiresAt: sellerSubscription.expiresAt,
              plan: sellerSubscription.plan,
              planId: sellerSubscription.planId,
              timePeriod: sellerSubscription.timePeriod,
              price: sellerSubscription.price,
              isActive: sellerSubscription.isActive,
            }
          : null,
      };
    }));

    console.log("Seller Minified List with subscription:", modifiedSellers);

    return res.status(200).send({message: "Seller Minified List", response: modifiedSellers });
  } catch (error) {
    return res.status(500).send({ error: error.message });
  }
};
 // Make sure this is imported at the top


 exports.deleteDeveloperProfile = async (req, res) => {
   try {
     const userId = req.body.userId;
     const deleteOption = req.body.deleteOption;
 
     if (!userId) {
       return res.status(400).json({ success: false, message: "User ID is missing" });
     }
 
     const user = await Seller.findById(userId);
     if (!user) {
       return res.status(404).json({ success: false, message: "User not found" });
     }
 
     if (deleteOption === "softDelete") {
       user.isActive = false;
       await user.save();
       return res.status(200).json({
         success: true,
         message: "Profile deactivated successfully.",
         response: user,
       });
     }
 
     if (deleteOption === "completeDelete") {
       await Seller.findOneAndDelete({ _id: userId });
       console.log("Profile deleted successfully.");
 
      
       let userData = await usersModel.findOne({ _id: req.user._id }).lean();
       if (!userData) {
         userData = await Seller.findOne({ _id: req.user._id }).lean();
         if (!userData) {
           console.log("User not found in either model");
           return res.status(404).send({ status: 404, message: "User not found" });
         }
       }
 
     
       const userIp =
         req.headers['x-forwarded-for']?.split(',').shift() ||
         req.socket?.remoteAddress ||
         null;
 
       
       const interfaces = os.networkInterfaces();
       for (const name of Object.keys(interfaces)) {
         for (const iface of interfaces[name]) {
           if (iface.family === 'IPv4' && !iface.internal) {
             console.log(`Local IP Address: ${iface.address}`);
           }
         }
       }
 
       const emailData = {
         deletedUser: {
           name: user.username || user.fullName,
           email: user.email,
           phone: user.phone,
           role: user.interested,
           id: user._id,
           deletedAt: new Date()
         },
         userDetails: {
           name: req.user.username || req.user.fullName,
           email: req.user.email,
           role: req.user.interested,
           id: req.user._id,
           ipAddress: userIp
         }
       };
 
       const adminEmails = ['anchan@vrozart.com', 'ritik@vrozart.com', 'rocky@vrozart.com'];
       console.log("Sending deletion email to admins...");
       console.log("Admin emails:", adminEmails);
       console.log("Email data:", JSON.stringify(emailData, null, 2));
 
       try {
         await sendEmailUsers(adminEmails, emailData, 'user-deletion', 'User Account Deletion Notification');
         console.log("Deletion email sent successfully to all admins");
       } catch (emailError) {
         console.error("Failed to send deletion email:", emailError);
         // Continue with the deletion process even if email fails
       }
 
       return res.status(200).json({
         success: true,
         message: "Profile deleted successfully.",
       });
     }
 
     return res.status(400).json({ success: false, message: "Invalid delete option" });
   } catch (error) {
     console.error("Error deleting profile:", error);
     return res.status(500).json({ success: false, message: "Internal server error" });
   }
 };
 



exports.recoverDeveloperProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const { developerId } = req.params;
    const developer = await Seller.findById(developerId);
    if (!developer) {
      return res.status(404).json({ message: "Developer not found" });
    }
    developer.isActive = !developer.isActive;
    await developer.save();

    return res.status(200).send({
      message: "Status updated successfully",
      status: developer,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).send({ error: "Something broke" });
  }
};

exports.updateAllPropertiesStatus = async (req, res) => {
  try {
    // Retrieve all properties
    const allProperties = await Property.find();

    // Check if there are any properties
    if (!allProperties || allProperties.length === 0) {
      return res.status(400).send({ error: "No properties found" });
    }

    // Update status of each property to "available"
    await Promise.all(
      allProperties.map(async (property) => {
        await Property.findByIdAndUpdate(
          property._id,
          { $set: { propertyStatus: "available" } },
          { new: true }
        );
      })
    );

    return res.status(200).send({
      message: "Status updated successfully for all properties",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ error: "Something broke" });
  }
};


exports.updateAllPropertiesPrice = async (req, res) => {
  try {
    // Retrieve all properties
    const allProperties = await Property.find();

    // Check if there are any properties
    if (!allProperties || allProperties.length === 0) {
      return res.status(400).send({ error: "No properties found" });
    }

    // Update price of each property
    await Promise.all(
      allProperties.map(async (property) => {
        const price = property.price.toString();
        const zeroCount = (price.match(/0/g) || []).length;

        // Check if price is not more than 3 characters and has at most 1 zero
        if (price.length <= 3 && zeroCount <= 1) {
          const updatedPrice = `${price}00000`; // Add five zeroes to the price
          await Property.findByIdAndUpdate(
            property._id,
            { $set: { price: updatedPrice } },
            { new: true }
          );
        }
      })
    );

    return res.status(200).send({
      message: "Price updated successfully for all properties",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ error: "Something broke" });
  }
};

exports.getPropertiesWithDecimalPrice = async (req, res) => {
  try {
    // Retrieve all properties with a price field containing a decimal point after one character
    const propertiesWithDecimalAfterOneCharacter = await Property.find({
      price: { $regex: /^\d\.\d/ } // Regex to match prices with a decimal point after one character
    });

    // Get the count of properties with a decimal point after one character
    const count = propertiesWithDecimalAfterOneCharacter.length;

    // Check if there are any properties with a decimal point after one character
    if (count === 0) {
      return res.status(404).send({ error: "No properties with decimal after one character found" });
    }

    // Return the count and the properties
    return res.status(200).send({ count, properties: propertiesWithDecimalAfterOneCharacter });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ error: "An error occurred while retrieving properties" });
  }
};

// Create a new coupon
exports.createCoupon = async (req, res) => {
  console.log("enter in create coupon function...................")
  try {
    const {
      coupon: couponRaw,
      code: codeRaw,
      percent,
      expiryDate,
      status,
      discountType,
      discountValue,
      validUntil,
      isActive
    } = req.body;

    console.log('Incoming body:', JSON.stringify(req.body));

    // Normalize fields (support legacy and new payloads)
    const couponCode = String(couponRaw || codeRaw || '').trim().toUpperCase();
    const effectivePercent = (discountValue != null ? Number(discountValue) : (percent != null ? Number(percent) : null));
    const effectiveExpiry = validUntil || expiryDate;

    console.log('Normalized values:', { couponCode, effectivePercent, effectiveExpiry, discountType, isActive, status });

    if (!couponCode || effectivePercent == null || !effectiveExpiry) {
      console.warn('Validation failed:', { couponCodeMissing: !couponCode, percentMissing: effectivePercent == null, expiryMissing: !effectiveExpiry });
      return res.status(400).send({ status: 400, message: 'Missing required fields' });
    }

    const Coupon = require('../model/coupon.model');

    // Block only if an active, non-expired coupon with same code exists
    const now = new Date();
    const existenceQuery = {
      $and: [
        { $or: [{ code: couponCode }, { coupon: couponCode }] },
        { $or: [{ isActive: true }, { status: 'active' }] },
        { $or: [{ validUntil: { $gt: now } }, { expiryDate: { $gt: now } }] }
      ]
    };
    console.log('Existence check query:', JSON.stringify(existenceQuery));
    const existing = await Coupon.findOne(existenceQuery);
    console.log('Existence check result:', existing ? { _id: existing._id, code: existing.code || existing.coupon } : null);
    if (existing) {
      return res.status(400).send({ status: 400, message: 'A coupon with this code already exists and is active.' });
    }

    const payloadToCreate = {
      coupon: couponCode,
      code: couponCode,
      percent: effectivePercent,
      discountType: discountType || 'percentage',
      discountValue: effectivePercent,
      expiryDate: effectiveExpiry,
      validUntil: effectiveExpiry,
      status: status || (isActive === false ? 'inactive' : 'active'),
      isActive: isActive != null ? Boolean(isActive) : (status ? status === 'active' : true)
    };
    console.log('Create payload:', payloadToCreate);

    // If a document with this code exists but is expired/inactive, update it instead of creating new
    const existingAny = await Coupon.findOne({ $or: [{ code: couponCode }, { coupon: couponCode }] });
    if (existingAny) {
      const existingExpiry = existingAny.validUntil || existingAny.expiryDate;
      const isExpired = existingExpiry ? (new Date(existingExpiry) <= now) : true;
      const isInactive = existingAny.isActive === false || existingAny.status === 'inactive';

      if (isExpired || isInactive) {
        const updated = await Coupon.findByIdAndUpdate(
          existingAny._id,
          { $set: { ...payloadToCreate } },
          { new: true }
        );
        console.log('Reused expired/inactive coupon by updating:', updated && updated._id);
        return res.status(200).send({ status: 200, message: 'Coupon updated (reused expired/inactive code)', data: updated });
      }
    }

    const newCoupon = await Coupon.create(payloadToCreate);
    console.log('Saved coupon:', newCoupon);
    return res.status(201).send({ status: 201, message: 'Coupon created', data: newCoupon });
  } catch (err) {
    console.error('Create coupon error:', err);
    if (err && err.code === 11000) {
      return res.status(409).send({ status: 409, message: 'Duplicate coupon code' });
    }
    return res.status(500).send({ status: 500, message: err.message });
  }
};

// Get all coupons
exports.getCoupons = async (req, res) => {
  try {
    const Coupon = require('../model/coupon.model');
    const coupons = await Coupon.find().sort({ createdDate: -1 });
    return res.status(200).send({ status: 200, data: coupons });
  } catch (err) {
    return res.status(500).send({ status: 500, message: err.message });
  }
};

// Update a coupon by ID (status only)
exports.updateCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!status) {
      return res.status(400).send({ status: 400, message: 'Status is required' });
    }
    const Coupon = require('../model/coupon.model');
    const updated = await Coupon.findByIdAndUpdate(
      id,
      { $set: { status } },
      { new: true }
    );
    if (!updated) {
      return res.status(404).send({ status: 404, message: 'Coupon not found' });
    }
    return res.status(200).send({ status: 200, message: 'Coupon status updated', data: updated });
  } catch (err) {
    return res.status(500).send({ status: 500, message: err.message });
  }
};

// Delete a coupon by ID
exports.deleteCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    const Coupon = require('../model/coupon.model');
    const deleted = await Coupon.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).send({ status: 404, message: 'Coupon not found' });
    }
    return res.status(200).send({ status: 200, message: 'Coupon deleted' });
  } catch (err) {
    return res.status(500).send({ status: 500, message: err.message });
  }
};

// Coupon validation endpoint
exports.validateCoupon = async (req, res) => {
  console.log("enter in validation function...................")
  try {
    const { couponCode, planId, planName, duration, subtotal, monthlyPrice } = req.body;

    console.log(couponCode,"couponCode", planId, planName, duration, subtotal, monthlyPrice)

    // Validate required fields
    if (!couponCode || !subtotal) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields"
      });
    }

    const Coupon = require('../model/coupon.model');

    // Build and log query; Find coupon in database
    const query = {
      $and: [
        { $or: [
          { code: couponCode.toUpperCase() },
          { coupon: couponCode.toUpperCase() }
        ]},
        { $or: [
          { isActive: true },
          { status: 'active' }
        ]}
      ]
    };
    console.log('Coupon validation query:', JSON.stringify(query));
    const coupon = await Coupon.findOne(query);
    console.log('Coupon lookup result:', coupon ? { _id: coupon._id, code: coupon.code || coupon.coupon } : null);
     
    if (!coupon) {
      console.warn('Coupon not found for code:', couponCode && couponCode.toUpperCase());
      return res.status(400).json({
        success: false,
        message: "Invalid coupon code",
        error: "COUPON_NOT_FOUND"
      });
    }

    // Check if coupon is expired
    const expiryDate = coupon.validUntil || coupon.expiryDate;
    if (new Date() > new Date(expiryDate)) {
      return res.status(400).json({
        success: false,
        message: "Coupon has expired",
        error: "COUPON_EXPIRED"
      });
    }


    // Check minimum amount requirement
    const minAmount = coupon.minAmount || 0;
    if (subtotal < minAmount) {
      return res.status(400).json({
        success: false,
        message: `Minimum order amount of ${minAmount} required`,
        error: "COUPON_MIN_AMOUNT_NOT_MET"
      });
    }

    // Calculate discount amount
    let discountAmount = 0;
    const discountType = coupon.discountType || 'percentage';
    const discountValue = coupon.discountValue || coupon.percent;

    if (discountType === 'percentage') {
      discountAmount = (subtotal * discountValue) / 100;
      // Apply maximum discount limit if set
      if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
        discountAmount = coupon.maxDiscount;
      }
    } else if (discountType === 'fixed') {
      discountAmount = discountValue;
    }

    // Ensure discount doesn't exceed subtotal
    if (discountAmount > subtotal) {
      discountAmount = subtotal;
    }


    res.json({
      success: true,
      message: "Coupon applied successfully",
      coupon: {
        code: coupon.code || coupon.coupon,
        discountType: discountType,
        discountValue: discountValue,
        discountAmount: Math.round(discountAmount * 100) / 100, // Round to 2 decimal places
        description: coupon.description,
        validUntil: expiryDate,
        minAmount: minAmount,
        maxDiscount: coupon.maxDiscount
      }
    });

  } catch (error) {
    console.error('Coupon validation error:', error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};