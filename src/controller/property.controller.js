const propertyModel = require("./../model/property.model");
const { v4: uuidv4 } = require("uuid");
const { validationResult } = require("express-validator");
const sellerModel = require("../model/seller.model");
const sellerSubModel = require("../model/sellerSub.model");const activityTrackerModel = require("../model/activityTracker.model");
const PropertyViews = require("../model/propertyViews");
const moment = require("moment");
const Requests = require("../model/savedProperties");
const Saved = require("../model/buyerSaved");
const cloudinary = require("./../utils/cloudinary.utils");
const sendEmailSign = require("../utils/emailSend.js");
const {
  uploadImage,
  uploadVideo,
  uploadPDF,
} = require("../utils/conrollerUtils");
const mongoose = require("mongoose");
const axios = require('axios');

// add the property to  DB
exports.postProperty = async (req, res) => {
  try {
    console.log("Request Body:", req.body);
    const userId = req.user?._id;
    const userData = await sellerModel.findOne({ _id: userId }).lean();
    let re = new RegExp("^(http|https)://", "i");
    if (!userData || userData.profileCompleted !== true) {
      return res
        .status(200)
        .send({ status: 400, message: "Please complete your profile" });
    }

    const payload = req.body;
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.send({ status: 422, errors: errors.array() });
    }

    const { email } = req.user;

    let {
      images,
      videos,
      layoutMap,
      heroImage,
      masterPlan,
      logo,
      maintainanceBills,
      propertyPapers,
      documentName,
      documentFile,
      status,
      daysAvailiblity,
      days,
      alldaysAvailable,
      from,
      to,
      slots,
      priceMax,
      minArea,
      maxArea,
      pricePerMeter,
      pricePerYard,
      areaType,
      userInput,
      manageFarms,
      maintainaceOfYears,
      balconies,
      bathrooms,
      bedrooms,
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
      managed_farmland,
      sponsored,
      estateType,
    } = payload;

   // Function to generate slots from 12:00:00 to 24:00:00 and mark the available ones between from and to times
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
    // Generate slots if from and to times are provided
    slots = generateSlots(from, to);
  }


    let imagesArray = [],
    layoutMapArray = [],
      videosArray = [],
      maintainanceBillsArray = [],
      propertyPapersArray = [],
      masterPlanUrl = "";
    logoUrl = "";
    let heroImageUrl = "";

    // check for subscription and count

    let seller = await sellerModel
      .findOne({ email })
      .select({ subscription: 1, count: 1 })
      .lean();

    if (seller) {
      if (seller.count >= 1 && !seller.subscription) {
        return res.send({
          status: 400,
          message: "Please buy subscription plan !",
        });
      }
    }

    // Upload hero image to AWS S3
    if (heroImage) {
      const heroImageResult = await uploadImage(heroImage);
      heroImageUrl = heroImageResult.Location;
    }
    if (logo) {
      const logoResult = await uploadImage(logo);
      logoUrl = logoResult.Location;
    }
    // Upload masterPlan to AWS S3
    if (masterPlan) {
      const masterPlanResult = await uploadImage(heroImage);
      masterPlanUrl = masterPlanResult.Location;
    }

    // Upload images to AWS S3
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

    // Upload videos to AWS S3
    if (videos && videos.length) {
      for (let i = 0; i < videos.length; i++) {
        if (!re.test(videos[i])) {
          let videoResult = await uploadVideo(videos[i]);
          videosArray.push(videoResult.Location);
        } else {
          videosArray.push(videos[i]);
        }
      }
    }

    //Upload layout maps to AWS S3
    if (layoutMap && layoutMap.length) {
      for (let i = 0; i < layoutMap.length; i++) {
        const layoutMapResult = await uploadImage(layoutMap[i]);
        layoutMapArray.push(layoutMapResult.Location);
      }
    }
    // if (layoutMap) {
    //   const layoutMapResult = await uploadImage(layoutMap);
    //   layoutMapUrl = layoutMapResult.Location;
    // }

    const propertyCode = uuidv4().slice(0, 8);
    let { price, plotLength, plotBreadth, plotArea, totalAcre } = payload;
    let area = 0,
      pricePerSqft = 0;
    if (plotLength && plotBreadth) {
      area = Number(plotLength) * Number(plotBreadth);
      pricePerSqft = (Number(price) / area).toFixed(2);
    }
    let acreArea = 0;
    // if (plotArea && plotArea == "sqft") {
    //   acreArea = area / 43560;
    //   totalAcre = acreArea.toFixed(2);
    // }
    // if (plotArea && plotArea == "sqmt") {
    //   acreArea = area / 4046.86;
    //   totalAcre = acreArea.toFixed(2);
    // }
    // payload["totalAcre"] = totalAcre;
    let data = {
      ...payload,
      propertyCode: propertyCode,
      postedBy: userId,
      images: imagesArray,
      videos: videosArray,
      masterPlan: masterPlanUrl,
      layoutMap: layoutMapArray,
      heroImage: heroImageUrl,
      logo: logoUrl,
      maintainanceBills: maintainanceBillsArray,
      propertyPapers: propertyPapersArray,
      documentName : documentName,
      documentFile : documentFile,
      status,
      daysAvailiblity,
      days,
      alldaysAvailable,
      from,
      to,
      slots : slots,
      priceMax : priceMax,
      minArea : minArea,
      maxArea : maxArea,
      pricePerMeter : pricePerMeter,
      pricePerYard : pricePerYard,
      areaType : areaType,
      userInput : userInput,
      manageFarms : manageFarms,
      maintainaceOfYears : maintainaceOfYears,
      bedrooms : bedrooms,
      bathrooms : bathrooms,
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
      landmark : landmark,
      addBy : userId,
      managed_farmland: managed_farmland,
      sponsored : sponsored,
      estateType: estateType,
    };

    if (pricePerSqft > 0) {
      data = {
        ...data,
        pricePerSqft: pricePerSqft,
      };
    }

    // Remove documentName if it is an empty string
    if (payload.documentName === "") {
      delete payload.documentName;
    }
    if (data.documentName === "") {
      delete data.documentName;
    }
    const dataToUpdate = await propertyModel.create({ ...data });
    if (dataToUpdate) {
      await sellerModel.findOneAndUpdate({ email }, { $inc: { count: 1 } });
      await activityTrackerModel.findOneAndUpdate(
        { email },
        { $set: { propertyPostDate: moment(new Date()).format("DD-MM-YYYY") } }
      );
      if (dataToUpdate.status == "publish"){
        const data = {
          Name: userData.fullName,
          propertyName: dataToUpdate.propertyTitle,
          PropertyType: dataToUpdate.propertyType, 
          Price: dataToUpdate.price, 
          TotalArea: dataToUpdate.totalAcre, 
          status: dataToUpdate.propertyApproval,
        }
        await sendEmailSign(userData.email, data, "review", `Property Status is In-Review`);
      }
      return res.send({
        status: 201,
        message: dataToUpdate.status === "draft" ? "Property saved as draft successfully" : "Property posted successfully",
        data: dataToUpdate,
      });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).send({ status: 500, message: err.message });
  }
};

exports.editProperty = async (req, res) => {
  try {
    const userId = req.user?._id;
    const userData = await sellerModel.findOne({ _id: userId }).lean();
    const propertyCode = req.query.propertyCode;
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.send({ status: 422, errors: errors.array() });
    }

    const payload = req.body;
    const re = new RegExp("^(http|https)://", "i");

    let {
      price,
      plotLength,
      plotBreadth,
      images,
      videos,
      layoutMap,
      heroImage,
      masterPlan,
      totalAcre,
      plotArea,
      logo,
      maintainanceBills,
      propertyPapers,
      documentName,
      documentFile,
      status,
      daysAvailiblity,
      alldaysAvailable,
      from,
      to,
      slots,
      priceMax,
      minArea,
      maxArea,
      pricePerMeter,
      pricePerYard,
      areaType,
      userInput,
      manageFarms,
      maintainaceOfYears,
      bedrooms,
      bathrooms,
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
      managed_farmland,
      sponsored,
      estateType,
    } = payload;

    let imagesArray = [],
      layoutMapArray = [],
      heroImageUrl = "",
      masterPlanUrl = "",
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

    const existingProperty = await propertyModel.findOne({ propertyCode });

    if (!existingProperty) {
      return res.status(404).send({ status: 404, message: "Property not found" });
    }

    // Preserve existing data
    if (!layoutMap) {
      layoutMapArray = existingProperty.layoutMap || [];
    }

    if (heroImage && !re.test(heroImage)) {
      const heroImageResult = await uploadImage(heroImage);
      heroImageUrl = heroImageResult.Location;
    }

    if (logo && !re.test(logo)) {
      const logoResult = await uploadImage(logo);
      logoUrl = logoResult.Location;
    }

    if (masterPlan && !re.test(masterPlan)) {
      const masterPlanResult = await uploadImage(masterPlan);
      masterPlanUrl = masterPlanResult.Location;
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

    let data = { ...payload };

    if (heroImageUrl !== "") {
      data.heroImage = heroImageUrl;
    }

    if (logoUrl !== "") {
      data.logo = logoUrl;
    }

    if (masterPlanUrl !== "") {
      data.masterPlan = masterPlanUrl;
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

    if (pricePerSqft > 0) {
      data.pricePerSqft = pricePerSqft;
    }

    // Preserve or update daysAvailiblity, alldaysAvailable, from, to, slots
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

    if (status !== undefined) {
      data.status = status;
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
    if(userInput){
      data.userInput = userInput  
    }
    if(manageFarms){
      data.manageFarms = manageFarms  
    }
    if(maintainaceOfYears){
      data.maintainaceOfYears = maintainaceOfYears
    }
    if(balconies){
      data.balconies = balconies
    }
    if(bathrooms){
      data.bathrooms = bathrooms
    }
    if(bathrooms){
      data.bathrooms = bathrooms
    }
    if(facingRoadWidth){
      data.facingRoadWidth = facingRoadWidth
    }
    if(facingWidthType){
      data.facingWidthType = facingWidthType
    }
    if(facing){
      data.facing = facing
    }
    if(buildUpArea){
      data.buildUpArea = buildUpArea
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
    if (managed_farmland !== undefined) {
      data.managed_farmland = managed_farmland;
    }
    if (sponsored !== undefined) {
      data.sponsored = sponsored;
    }
    if (estateType !== undefined) {
      data.estateType = estateType;
    }

    const update = { $set: { ...data } };

    const isUpdate = await propertyModel.findOneAndUpdate(
      { propertyCode },
      update,
      { new: true }
    );

    if (isUpdate.status == "publish"){
      const data = {
        Name: userData.fullName,
        propertyName: isUpdate.propertyTitle,
        PropertyType: isUpdate.propertyType, 
        Price: isUpdate.price, 
        TotalArea: isUpdate.totalAcre, 
        status: isUpdate.propertyApproval,
      }
      await sendEmailSign(userData.email, data, "review", `Property Status is In-Review`);
    }

    if (isUpdate) {
      return res.send({
        status: 200,
        message: "Property updated successfully",
        data: isUpdate,
      });
    }
  } catch (err) {
    console.log(err);
    return res.status(500).send({ status: 500, message: err.message });
  }
};

// exports.propertyDetails = async (req, res) => {
//   try {
//     let user = null;
//     if (req.user) {
//       user = req.user._id;
//     }
//     const propertyCode = req.query.propertyCode;
//     const errors = validationResult(req);

//     if (!errors.isEmpty()) {
//       return res.send({ status: 422, errors: errors.array() });
//     }
//     let getPropertyData = await propertyModel
//       .findOneAndUpdate(
//         { propertyCode },
//         { $inc: { propertyView: 1 } },
//         { new: true, timestamps: false }
//       )
//       .populate({
//         path: "postedBy",
//         model: "sellers",
//       })
//       .populate({
//         path : "documentName",
//         model : "documentsType"
//       })

//     // Default values for saved and visitRequest
//     let saved = false;
//     let visitRequest = false;

//     // Check if user is logged in
//     if (user) {
//       const savedProperty = await Saved.findOne({
//         properties: getPropertyData?._id,
//         savedBy: user,
//       });

//       // Update saved and visitRequest values based on user login status and saved property
//       if (savedProperty) {
//         saved = savedProperty.saved;
//         visitRequest = savedProperty.visitRequest;
//       }
//     }
//     // Update getPropertyData with saved and visitRequest properties
//     getPropertyData = {
//       ...getPropertyData?._doc,
//       saved,
//       visitRequest,
//     };

//     if (getPropertyData && Object.keys(getPropertyData).length) {
//       getPropertyData["categoryId"] = getPropertyData["propertyCategory"][
//         "categoryId"
//       ]
//         ? getPropertyData["propertyCategory"]["categoryId"]
//         : "";
//     }


//     if (getPropertyData) {
//       return res.send({
//         status: 200,
//         message: "Property details fetched successfully!",
//         data: getPropertyData,
//       });
//     } else {
//       return res.status(404).send({
//         status: 404,
//         message: "Property not found",
//       });
//     }
//   } catch (err) {
//     console.log(err);
//     return res.status(500).send({ status: 500, message: err.message });
//   }
// };

exports.propertyDetails = async (req, res) => {
  try {
    let user = null;
    if (req.user) {
      user = req.user._id;
    }
    const propertyCode = req.query.propertyCode;
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.send({ status: 422, errors: errors.array() });
    }

    let getPropertyData = await propertyModel
      .findOneAndUpdate(
        { propertyCode },
        { $inc: { propertyView: 1 } },
        { new: true, timestamps: false }
      )
      .populate({
        path: "postedBy",
        model: "sellers",
      })
      .populate({
        path: "documentName",
        model: "documentsType",
      });


     // 🔹 Check if property is deleted
    if (getPropertyData.isDeleted) {
      return res.status(200).send({
        status: "isDeleted",
        message: "This property has been deleted",
      });
    }

    // Default values for saved and visitRequest
    let saved = false;
    let visitRequest = false;

    
    // if (user) {
    //   const existingView = await PropertyViews.findOne({
    //     propertyId: getPropertyData?._id,
    //     viewedBy: user,
    //   });

      //if (!existingView) {
        await PropertyViews.create({
          propertyId: getPropertyData._id,
          viewedBy: user,
        });
      //}

      const savedProperty = await Saved.findOne({
        properties: getPropertyData?._id,
        savedBy: user,
      });

      if (savedProperty) {
        saved = savedProperty.saved;
        visitRequest = savedProperty.visitRequest;
      }
    //}

    getPropertyData = {
      ...getPropertyData?._doc,
      saved,
      visitRequest,
    };

    if (getPropertyData && Object.keys(getPropertyData).length) {
      getPropertyData["categoryId"] = getPropertyData["propertyCategory"][
        "categoryId"
      ]
        ? getPropertyData["propertyCategory"]["categoryId"]
        : "";
    }

    if (getPropertyData) {
      return res.send({
        status: 200,
        message: "Property details fetched successfully!",
        data: getPropertyData,
      });
    } else {
      return res.status(404).send({
        status: 404,
        message: "Property not found",
      });
    }
  } catch (err) {
    console.log(err);
    return res.status(500).send({ status: 500, message: err.message });
  }
};


exports.nearbyplace = async (req, res) => {
  try {
    const locality = req.query.locality;
    const city = req.query.city;
    const state = req.query.state;
    const apiKey = process.env.GOOGLE_API_KEY;

    if (!apiKey) {
      return res.status(500).send({ error: "Google API key is missing from environment variables." });
    }

    if (!locality || !city || !state) {
      return res.status(400).send({ status: 400, message: "locality, city, and state are required" });
    }

    const location = `${locality}, ${city}, ${state}`;

    //URLs for different types of places
    const placeTypes = [
      { type: 'tourist_attractions', query: 'tourist attractions' },
      { type: 'shopping_malls', query: 'shopping malls' },
      { type: 'restaurants', query: 'restaurants'},
      { type: 'schools', query: 'schools'},
      { type: 'hospitals', query: 'hospitals'},
      { type: 'airports', query: 'international terminal airport'},
      { type: 'upcoming_Projects', query: 'government projects'}
    ];

    //data for each place type
    const promises = placeTypes.map(async ({ type, query, icon }) => {
      const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}+in+${encodeURIComponent(location)}&key=${apiKey}`;
      const response = await axios.get(url);

      if (response.data.status !== 'OK') {
        throw new Error(`Failed to fetch nearby ${type}: ${response.data.error_message || 'Unknown error'}`);
      }

      const results = response.data.results;

      // Fetch distances to the destination
      const destinations = results.map(place => place.formatted_address).join('|');
      const distanceUrl = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(location)}&destinations=${encodeURIComponent(destinations)}&key=${apiKey}`;
      const distanceResponse = await axios.get(distanceUrl);

      if (distanceResponse.data.status !== 'OK') {
        throw new Error(`Failed to fetch distances for ${type}: ${distanceResponse.data.error_message || 'Unknown error'}`);
      }

      const distances = distanceResponse.data.rows[0].elements;

      //formatted places array
      const places = results.map((place, index) => ({
        name: place.name,
        address: place.formatted_address,
        mapUrl: `https://www.google.com/maps/place/?q=place_id:${place.place_id}`,
        embeddedMapUrl: `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=place_id:${place.place_id}`,
        distance: distances[index].distance.text,
        duration: distances[index].duration.text
      }));

      return {
        type,
        places
      };
    });

    // Fetch coordinates for the searched location
    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(location)}&key=${apiKey}`;
    const geocodeResponse = await axios.get(geocodeUrl);

    if (geocodeResponse.data.status !== 'OK') {
      throw new Error(`Failed to fetch location coordinates: ${geocodeResponse.data.error_message || 'Unknown error'}`);
    }

    const coordinates = geocodeResponse.data.results[0].geometry.location;
    const mapLocationUrl = `https://www.google.com/maps?q=${coordinates.lat},${coordinates.lng}`;
    const embeddedMapUrl = `https://www.google.com/maps/embed/v1/view?key=${apiKey}&center=${coordinates.lat},${coordinates.lng}&zoom=15`; // Include center and zoom parameters

   
    const results = await Promise.all(promises);

    // Prepare final response
    const finalResponse = {
      status: 200,
      searchedLocation: {
        locality,
        city,
        state,
        mapLocationUrl,
        embeddedMapUrl
      },
      highlights: results.find(result => result.type === 'tourist_attractions').places,
      shoppingMalls: results.find(result => result.type === 'shopping_malls').places,
      restaurants: results.find(result => result.type === 'restaurants').places,
      schools: results.find(result => result.type === 'schools').places,
      hospitals: results.find(result => result.type === 'hospitals').places,
      airports: results.find(result => result.type === 'airports').places,
      UpcomingProjects: results.find(result => result.type === 'upcoming_Projects').places
    };

    res.status(200).send(finalResponse);
  } catch (error) {
    console.log("otp error", error);
    res.status(500).send({ error : "Something went wrong" });
  }
};

exports.propertyList = async (req, res) => {
  try {
    const userId = req.user._id;
    if (!userId) return res.status(400).send({ error: "User ID not found" });

    let page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 10;
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

    let filterPropertyApproval = {};
    const filter = req.query.propertyApproval || "";
    if (filter) {
      if (
        filter === "IN_Review" ||
        filter === "Resolved" ||
        filter === "Reject"
      ) {
        filterPropertyApproval = { propertyApproval: filter };
      } else {
        return res
          .status(400)
          .send({ error: "Filter is not per requirements" });
      }
    }

    let propertyTypeQuery = {};
    const propertyTypeFilter = req.query.propertyType || "";
    if (propertyTypeFilter) {
      const allowedPropertyTypes = [
        "agricultureLand",
        "Estates",
        "farmhouse",
        "farmland",
      ];
      if (allowedPropertyTypes.includes(propertyTypeFilter)) {
        propertyTypeQuery = { propertyType: propertyTypeFilter };
      } else {
        return res
          .status(400)
          .send({ error: "Property type is not per requirements" });
      }
    }

    let statusFilter = req.query.status || "";
    let statusQuery = {};

    if (statusFilter) {
      if (statusFilter === "draft") {
        statusQuery = { status: "draft" };
      } else if (statusFilter === "publish") {
        statusQuery = { status: "publish" };
      } else {
        return res
          .status(400)
          .send({ error: "Property type is not per requirements" });
      }
    }

    const totalCount = await propertyModel.countDocuments({
      postedBy: userId,
      ...searchQuery,
      ...filterPropertyApproval,
      ...propertyTypeQuery,
      ...statusQuery,
    });

    // const properties = await propertyModel
    //   .find({
    //     postedBy: userId,
    //     ...searchQuery,
    //     ...filterPropertyApproval,
    //     ...propertyTypeQuery,
    //   })
    //   .populate({
    //     path: "postedBy",
    //     model: "sellers",
    //     select: "-password -verificationToken",
    //   })
    //   .skip(startIndex)
    //   .limit(limit)
    //   .sort(req.query.sort || "-createdAt")
    //   .exec();

    let sort = req.query.sort ? req.query.sort.split("-")[1] : "createdAt";
    let sortBy = {
      [sort]: -1,
    };

    const propertdata = await propertyModel.aggregate([
      {
        $match: {
          postedBy: new mongoose.Types.ObjectId(userId),
          ...searchQuery,
          ...filterPropertyApproval,
          ...propertyTypeQuery,
          ...statusQuery,
        },
      },
      { $sort: { ...sortBy } },
      {
        $lookup: {
          from: "sellersubs",
          let: { id: "$postedBy" },
          pipeline: [
            { $match: { $expr: { $eq: ["$id", "$$id"] } } },
            { $project: { isActive: 1, plan: 1, expiresAt: 1 } },
          ],
          as: "subscription",
        },
      },
      { $unwind: { path: "$subscription", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "sellers",
          let: { id: "$postedBy" },
          pipeline: [
            { $match: { $expr: { $eq: ["$_id", "$$id"] } } },
            { $project: { password: 0, verificationToken: 0 } },
          ],
          as: "postedBy",
        },
      },
      { $unwind: "$postedBy" },
      { $skip: startIndex },
      { $limit: limit },
    ]);

    // console.log("property", propertdata);
    res.json({
      resStatus: true,
      res: propertdata,
      count: totalCount,
    });
  } catch (error) {
    console.log("otp error", error);
    return res.status(500).send({ error: "Something broke!" });
  }
};

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

exports.statusManagement = async (req, res) => {
  try {
    const userEmail = req.user.email;
    const user = await sellerModel.findOne({ email: userEmail });
    if (!user) return res.status(400).send({ error: "User not found" });

    const propertyCode = req.query.propertyCode;
    if (!propertyCode)
      return res.status(400).send({ error: "Property code is required" });
    const property = await propertyModel.findOne({
      propertyCode: propertyCode,
    });
    if (!property) return res.status(400).send({ error: "Property not found" });

    const { propertyStatus } = req.body;
    if (!propertyStatus)
      return res.status(400).send({ error: "Status is required" });

    property.propertyStatus = propertyStatus;
    await property.save();
    return res.status(200).send({ success: "Status updated successfully" });
  } catch (error) {
    console.log("otp error", error);
    return res.status(500).send({ error: "Something broke" });
  }
};

exports.uploadMaintainanceBills = async function (req, res) {
  try {
    const maintainanceBills = req.files;
    if (!maintainanceBills || maintainanceBills.length === 0) {
      return res.status(400).send("No files found");
    }
    const uploadedFiles = [];
    for (const file of maintainanceBills) {
      const fileName = file.originalname.replace(/\s/g, "");
      const params = {
        Bucket: "viaa-bucket",
        Key: `${fileName}`,
        Body: file.buffer,
        ACL: "public-read",
        ContentType: file.mimetype,
      };
      const data = await S3.upload(params).promise();
      uploadedFiles.push(data);
    }
    res
      .status(200)
      .json({ successMessage: "Bills uploaded successfully", uploadedFiles });
  } catch (err) {
    console.error(err);
    return res.status(500).send("Failed to upload Bills");
  }
};

exports.uploadPropertyPapaers = async function (req, res) {
  try {
    const propertyPapers = req.files;
    if (!propertyPapers || propertyPapers.length === 0) {
      return res.status(400).send("No files found");
    }
    const uploadedFiles = [];
    for (const file of propertyPapers) {
      const fileName = file.originalname.replace(/\s/g, "");
      const params = {
        Bucket: "viaa-bucket",
        Key: `${fileName}`,
        Body: file.buffer,
        ACL: "public-read",
        ContentType: file.mimetype,
      };
      const data = await S3.upload(params).promise();
      uploadedFiles.push(data);
    }
    res
      .status(200)
      .json({ successMessage: "Papers uploaded successfully", uploadedFiles });
  } catch (err) {
    console.error(err);
    return res.status(500).send("Failed to upload papers");
  }
};

exports.downloadBrochure = async (req, res) => {
  try {
    let propertyId = req.params.propertyId;
    const property = await propertyModel.findById(propertyId);
    if (!property) {
      return res.status(404).send({ error: "Property not found" });
    }
    if (property.broucher && property.broucher.Location) {
      const brochureUrl = property.broucher.Location;
      const response = await axios.get(brochureUrl, { responseType: 'stream' });

      res.setHeader('Content-Disposition', `attachment; filename=${property.broucher.key}`);
      res.setHeader('Content-Type', response.headers['content-type']);

      response.data.pipe(res);
    } else {
      return res.status(404).send({ error: "Brochure not available for this property" });
    }
  } catch (error) {
    console.log("otp error", error);
    return res.status(500).send({ error: "Something went wrong" });
  }
};
