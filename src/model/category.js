const { default: mongoose, Schema } = require("mongoose");

const categorySchema = new Schema({
  admin : {
    type : mongoose.Schema.Types.ObjectId,
    ref: "sellers"
  },
  category: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  associatedBlogs : {
    type : Number,
    default : 0,
  },
},
{
  timestamps: true
}
);

const Category = mongoose.model("category", categorySchema);
module.exports = Category;
