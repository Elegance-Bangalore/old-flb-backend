const {default : mongoose, Schema} = require("mongoose")

const documentsTypeSchema = new Schema({
    name : {
        type : String,
        required : true
    }
},
{timestamps : true}
)

const DocumentsType = mongoose.model("documentsType", documentsTypeSchema)
module.exports = DocumentsType