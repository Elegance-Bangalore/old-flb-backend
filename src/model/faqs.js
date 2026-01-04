const { default: mongoose, Schema } = require("mongoose");

const faqsSchema = new Schema({
  admin : {
    type : mongoose.Schema.Types.ObjectId,
    ref: "sellers"
  },
  category: {
    type: String,
    enum : ["general", "account", "buyer", "seller"],
    required : true,
  },
  question: {
    type: String,
    required : true,
  },
  answers : {
    type : String,
    required : true,
  },
},
{timestamps : true}
);

const Faq = mongoose.model("faq", faqsSchema);
module.exports = Faq;
