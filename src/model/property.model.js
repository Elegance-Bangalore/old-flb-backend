const { model, Schema } = require("mongoose");
const mongoose = require("mongoose");

const propertySchema = new Schema(
  {
    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
    },
    propertyCode: String,
    propertyType: String,
    propertyTitle: String,
    videoUrl: [String], // you tube url
    otherAmenities: Array,
    plotArea: {
      type: String,
      enum: ["sqft", "sqmt", "acre"],
    },
    plotLength: String,
    plotBreadth: String,
    possessionStatus: {
      type: String,
      enum: ["immediate", "future"],
    },
    possessionDate: {
      type: String,
      default: "",
    },
    reraApproved: String,
    price: String,
    pricePerSqft: String,
    totalAcre: String,
    negotiablePrice: String,
    boundWallMade: String,
    openSidesCount: String,
    propertyDescription: String,
    city: String,
    state: String,
    logo: String,
    locality: String,
    map: String,
    amenities: Array,
    //layoutMap: String,
    layoutMap: [String],
    images: [String],
    videos: [String],
    plotShow: String,
    secondaryNum: Number,
    availability: String,
    scheduledTime: String,
    heroImage: String,
    masterPlan: String,
    propertyStatus: {
      type: String,
      default: "new", // available, sold
    },
    propertyApproval: {
      type: String,
      enum: ["IN_Review", "Resolved", "Reject"],
      default: "IN_Review",
    },
    saved: {
      type: Boolean,
      default: false,
    },
    highlyRecommended: {
      type: Boolean,
      default: false,
    },
    maintainanceBills: [
      {
        type: {},
      },
    ],
    propertyPapers: [
      {
        type: {},
      },
    ],
    documentName : {
      type: mongoose.Schema.Types.ObjectId
    },
    documentFile : {},
    isDeleted: {
      type: Boolean,
      default: false,
    },
    editBy: {
      type: mongoose.Schema.Types.ObjectId,
    },
    addBy: {
      type: mongoose.Schema.Types.ObjectId,
    },
    propertyCategory: {
      categoryId: mongoose.Schema.Types.ObjectId,
      status: Boolean,
    },
    estateType: {
      type: String,
      default: null,
    },
    isPropertyPromoted: {
      type: Boolean,
      default: false,
    },
    promoteExpires : Date,
    propertyAds: String,
    prmotionType : String,
    promotionCity : [{
      type : String}],
    propertyView: {
      type: Number,
    },
    soldOutDate : Date,
    status : {
      type : String,
      default : "publish",
      enum : ["draft" , "publish"]
    },
    customCreatedAt: {
      type: Date,
      default: null,
    },
    daysAvailiblity : {
      type : String,
    },
    days : [{
      type : String,
  }],
    alldaysAvailable : {
      type : Boolean,
      default : false
    },
    from: String,
    to: String,
    slots: [
      {
        slot: String, 
        available: {
          type: Boolean,
          default: false,
        },
      },
    ],
  priceMax : String,
  minArea : String,
  maxArea : String,
  pricePerMeter : String,
  pricePerYard : String,
  areaType : String,
  broucher : Object,
  userInput : {
    type : Boolean,
    default : false
  },
  manageFarms : String,
  maintainaceOfYears : String,
  balconies : String,
  bedrooms : String,
  bathrooms : String,
  buildUpArea: String,
  floorDetails: String,
  ageOfProperty: String,
  transactionType: String,
  ownershipType: String,
  facingRoadWidth: String,
  facing : String,
  facingWidthType : String,
  farmhouseStatus : String,
  landmark : String,
  bannerType  : String,
  bannerTitle : String,
  bedroomsImages: [{
    type : {}
  }],
  bathroomsImages: [{
    type : {}
  }],
  exteriorViewImages: [{
    type : {}
  }],
  kitchenImages: [{
    type : {}}],
  floorPlanImages: [{
    type : {}
  }],
  managed_farmland: {
    type: Boolean,
    default: false,
  },
  sponsored: {
    type: Boolean,
    default: false,
  },
  },
  { timestamps: true }
);

module.exports = model("properties", propertySchema);
