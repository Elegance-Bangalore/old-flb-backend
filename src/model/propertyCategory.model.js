const {default : mongoose, model, Schema} = require("mongoose");
const PropertyCategorySchema = new Schema ({
    name : String,
    categoryName : String,
    visible : {
        type : Boolean,
        default : true
    },
    description : String,
    order : String,
    admin: {
        type: mongoose.Schema.Types.ObjectId,
      },
      price: String,
      city : [],
      propertyView : Number,
      shortlistCount : Number,
      days : Number || 15,
      count : Number || 15,
},{timestamps : true});

module.exports = model("propertyCategory", PropertyCategorySchema);