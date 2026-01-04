const { default: mongoose, Schema } = require("mongoose");

const subCategorySchema = new Schema({
  admin : {
    type : mongoose.Schema.Types.ObjectId,
    ref: "sellers"
  },
  subCategory: {
    type: String,
    required: true,
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "category",
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

const SubCategory = mongoose.model("subcategory", subCategorySchema);
module.exports = SubCategory;
