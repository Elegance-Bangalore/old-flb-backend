const { default: mongoose, Schema } = require("mongoose");

const termsConditionSchema = new Schema(
  {
    termsCondition: {
      type: String,
    },
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "sellers",
    },
  },
  {
    timestamps: true,
  }
);

const TermsCondition = mongoose.model("termscondition", termsConditionSchema);
module.exports = TermsCondition;
