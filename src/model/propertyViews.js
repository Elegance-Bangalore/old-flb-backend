const {default : mongoose, Schema} = require("mongoose");

const propertyViewsSchema = new Schema({
    propertyId: {
        type: mongoose.Schema.Types.ObjectId,
    },
    viewedBy: {
        type: mongoose.Schema.Types.ObjectId,
    },
},
{ timestamps: true });

const PropertyViews = mongoose.model("propertyViews", propertyViewsSchema);
module.exports = PropertyViews