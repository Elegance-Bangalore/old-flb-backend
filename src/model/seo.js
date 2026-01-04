const {default : mongoose, Schema} = require("mongoose")

const seoCitySchema = new Schema({
    title : {
        type : String,
        required : true,
    },
    city : {
        type : String,
        required : true,
    },
    propertyType : {
        type : String,
        required : true,
    }
})

const SeoCity = mongoose.model("seocity", seoCitySchema)
module.exports = SeoCity