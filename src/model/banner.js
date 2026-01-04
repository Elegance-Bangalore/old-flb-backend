const {default : mongoose, Schema} = require("mongoose")

const bannerSchema = new Schema({
    banner : {
        type : String,
    },
    admin : {
        type : mongoose.Schema.Types.ObjectId,
    },
    type : {
        type : String,
        enum : ["top", "mid"]
    },
    propertyType : {
        type : String,
    },
    city : [{
        type : String,
}],
    bannerType : {
        type : String,
    },
    url : {
        type : String
    },
    propertyId : {
        type : mongoose.Schema.Types.ObjectId
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

const Banner = mongoose.model("banner", bannerSchema);
module.exports = Banner;