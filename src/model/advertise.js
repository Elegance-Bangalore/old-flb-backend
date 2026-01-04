const {default : mongoose, Schema} = require("mongoose")

const advertiseSchema  = new Schema({
    fullName : {
        type : String
    },
    designation : {
        type : String
    },
    companyName : {
        type : String,
    },
    cityOfHeadQuarter : {
        type : String,
    },
    businessEmailAddress : {
        type : String,
    },
    mobileNumber : {
        type : String,
    },
    spaceRequirement : Array,
    description : {
        type : String,
    }
}
,{timestamps : true})

const Advertise = mongoose.model("advertise", advertiseSchema)
module.exports = Advertise