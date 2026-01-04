const { model, Schema } = require("mongoose");
const bookingSlotSchema = new Schema({
  buyerName: String,
  buyerPhone: String,
  scheduledDateTime: Date,
  isAccepted :{
    type: Boolean,
    default: false
  },
  propertyCode : String,
  sellerId: String
});

module.exports = model("bookingslots", bookingSlotSchema);
