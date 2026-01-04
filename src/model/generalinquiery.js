const { default: mongoose, Schema } = require("mongoose");

const generalInquirySchema = new Schema({
  name: {
    type: String,
    required : true
  },
  phone : {
    type : String,
    required : true
  },
  email: {
    type: String,
    required : true,
  },
  message : {
    type : String,
    required : true,
  },
  reply : {
    type : String,
  },
  replyBy : {
    type : mongoose.Schema.Types.ObjectId,
  }
},
{timestamps : true}
);

const genaralInquiry = mongoose.model("genaralinquiry", generalInquirySchema);
module.exports = genaralInquiry;
