const {default : mongoose, model, Schema } = require("mongoose");
const UserSchema = new Schema(
  {
    username: String,
    email: String,
    phone : String,
    password: String,
    status: {
      type: Boolean,
      default: false,
    },
    interested :{
      type: String,
      default : "user"
    },

    manageProperty: {
      type: Boolean,
      default: false,
    },
    manageDeveloperProfile: {
      type: Boolean,
      default: false,
    },
    manageEnquiry: {
      type: Boolean,
      default: false,
    },
    manageUsers: {
      type: Boolean,
      default: false,
    },
    manageBlogs: {
      type: Boolean,
      default: false,
    },
    manageBlogCategory: {
      type: Boolean,
      default: false,
    },
    manageFooter: {
      type: Boolean,
      default: false,
    },
    manageAnalytics : {
      type: Boolean,
      default: false,
    },
    managePageContent : {
      type: Boolean,
      default: false,
    },
    isAccountVerified:{
      type: Boolean,
      default: false,
    },
    admin: {
      type: mongoose.Schema.Types.ObjectId,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = model("user", UserSchema);
