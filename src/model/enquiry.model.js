const { model, Schema } = require("mongoose");
const enquirySchema = new Schema(
  {
    propertyId : {
      type : Schema.Types.ObjectId,
      ref :"properties"
    },
    buyerId : {
      type: Schema.Types.ObjectId,
      ref : "sellers"
    },
    buyerName: String,
    buyerEmail: String,
    propertyTitle: String,
    buyerPhone: String,
    propertyCode : String,
    status: {
      type: String,
      default: "unread",
    },
    // ✅ New fields
      reasonToBuy: { type: String },
      preferredLocation: { type: String },
      budget: { type: String },
      homeLoanOptions: { type: Boolean, default: false },
      siteVisits: { type: Boolean, default: false },
      termsAgreed: { type: Boolean, default: false },
      },
  { timestamps: true }
);

module.exports = model("inquiries", enquirySchema);





