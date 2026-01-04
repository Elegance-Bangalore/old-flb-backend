const mongoose = require("mongoose");
const { Schema } = mongoose;

const SystemLog = new Schema(
  {
    location: {
      ip: { type: String },
      locality: { type: String },
      countryCode: { type: String },
      countryName: { type: String },
      principalSubdivision: { type: String },
      principalSubdivisionCode: { type: String },
    },
    buyerId: { type: mongoose.Schema.Types.ObjectId, ref: "sellers" },
    method: { type: String, default: "" },
    url: { type: String, default: "" },
    action_date: {
      type: Date,
      default: () => new Date(),
    },
  },
  { timestamps: true }
);

const model = mongoose.model("system-log", SystemLog);
module.exports = model;
