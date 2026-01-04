const {default : mongoose, Schema} = require("mongoose")

const carouselSchema = new Schema({
    title : {
        type : String,
    },
    desktopImage : {
        type : String,
    },
    mobileImage : {
        type : String,
    },
    status : {
        type : Boolean,
        default : true
    },
    propertyId : {
        type : mongoose.Schema.Types.ObjectId
    },
    url : {
        type : String
    },
    city : [{
        type : String
    }],
    caouselExpires : {
        type : Date,
    },
},
{timestamps : true},
)

const Carousel = mongoose.model("carousel", carouselSchema)
module.exports = Carousel