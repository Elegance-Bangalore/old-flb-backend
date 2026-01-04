const { default: mongoose, Schema } = require("mongoose");

const footerSchema = new Schema({
  selectPage: {
    type: String,
    required : true,
  },
  title: {
    type: String,
    required : true,
  },
  link : {
    type : String,
    required : true,
  },
  admin: {
    type: mongoose.Schema.Types.ObjectId,
  },
  status : {
    type : Boolean,
    default : true,
  },
},
{
  timestamps: true
}
);

const Footer = mongoose.model("footer", footerSchema);
module.exports = Footer;
