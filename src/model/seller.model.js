const { model, Schema, default: mongoose } = require("mongoose");
const sellerSchema = new Schema(
  {
    fullName: {
      type: String,
      required: true,
    },
    profilePic: { type: String, default: "" },
    email: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    password: String,
    interested: {
      type: String,
      enum: ["buy", "sell", "admin"],
    },
    i_am: { type: String, default: "" },
    city: { type: String, default: "" },
    companyName: { type: String, default: "" },
    about: { type: String, default: "" },
    logo: { type: String, default: "" },
    address: { type: String, default: "" },
    totalProjects: { type: String, default: "" },
    ongoingProjects: { type: String, default: "" },
    completedProjects: { type: String, default: "" },
    website: { type: String, default: "" },
    phoneOtp: { type: String, default: "" },
    isAccountVerified: {
      type: Boolean,
      default: false,
    },
    count: {
      type: Number,
      default: 0,
    },
    subscription: {
      type: Boolean,
      default: false,
    },
    subscriptionId: { type: String, default: "" },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    verificationToken: {
      type: String,
      default: "",
    },
    verificationTokenExpiresAt: {
      type: String,
      default: "",
    },
    tokenVerified: {
      type: Boolean,
      default: false,
    },
    profileCompleted: {
      type: Boolean,
      default: false,
    },
    notification: [
      {
        type: String,
        enum: ["email", "whatsapp", "text"],
      },
    ],
    alternateNumber: {
      type: String,
      default: "",
    },
    establishedYear: {
      type: String,
      default: "",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    featured : {
      type : Boolean,
      default : false,
    },
    featuredOrder: {
      type: Number,
      default: 0,
    },
    promoteCount : Number,
  },
  {
    toJSON: {
      transform: function (err, ret) {
        delete ret.__v;
        // delete ret.createdAt;
        // delete ret.updatedAt;
        delete ret.password;
      },
    },
    timestamps: true,
  }
);

module.exports = model("sellers", sellerSchema);
