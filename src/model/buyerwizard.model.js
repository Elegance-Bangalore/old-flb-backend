const { model, Schema } = require("mongoose");
const buyerwizardSchema = new Schema(
  {
    propertySize: String,
    budgerRange: String,
    city: String,
    location: String,
    specificAreaOfInterest: String,
    propertyType: String,
    amenities:[String]
  },
  { timestamps: true }
);

module.exports = model('buyerinterests', buyerwizardSchema)