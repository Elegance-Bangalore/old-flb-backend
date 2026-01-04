const { model, Schema } = require("mongoose");
const mongoose = require("mongoose");
const sellerSubSchema = new Schema(
  {
    id: {
      type : mongoose.Schema.Types.ObjectId
    },
    expiresAt: String,  // "DD-MM-YYYY"
    plan: { type: String, enum: ["Basic", "Silver", "Gold", "Platinum"] },
    planId : String,  // from razor pay
    timePeriod: String,
    price : String,
    isActive : {
        type: Boolean,
        default: false,
    },
    email:String
  },
  { timestamps: true }
);

module.exports = model("sellersubs", sellerSubSchema);
