const {model, Schema} = require("mongoose");
const AmenitiesSchema = new Schema({
    sellerId : {
        type : Schema.Types.ObjectId,
        ref : "sellers"
    },
    amenities :Array
},{timestamps : true});

module.exports = model("amenities",AmenitiesSchema);
