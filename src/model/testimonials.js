const {default: mongoose, Schema} = require("mongoose");

const testimonialsSchema = new Schema({
    name : {
        type : String,
    },
    type : {
        type : String,
    },
    description : {
        type : String,
    },
    image : {
        type : {}
    },
    youTubeLink : {
        type : String,
    },
    ratings : {
        type : String,
    },
    status : {
        type : Boolean,
        default : true
    },
    addBy : {
        type : mongoose.Schema.Types.ObjectId
    },
},
{timestamps : true}
)

const Testimonial = mongoose.model("testimonials", testimonialsSchema)
module.exports = Testimonial