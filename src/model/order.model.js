const {model, Schema} = require("mongoose");
const orderSchema = new Schema(
  {
    userId: String,
    razorpay_order_id : String, 
    razorpay_payment_id :String,
    razorpay_signature : String,
    amount: Number,
    currency: String,
    status: String,
    planName: String,
    timePeriod: String
  },
  { timestamps: true }
);

module.exports = model("orders", orderSchema);
