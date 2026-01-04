const {default : mongoose, Schema} = require("mongoose")

const contactUsSchema = new Schema({
    admin : {
        type : mongoose.Schema.Types.ObjectId,
    },
    title : {
        type : String,
        required : true,
    },
    subtitle : {
        type : String,
        required : true,
    },
    email : {
        type : String,
        required : true,    
    },
    number : {
        type : String,
        required : true,
    },
    alternateNumber : {
        type : String,
    },
    address : {
        type : String,
        required : true,
    },
    link : {
        type : String,
        required : true,
    }

},
{timestamps : true},
)

const contactUs = mongoose.model("contactus",contactUsSchema)
module.exports = contactUs