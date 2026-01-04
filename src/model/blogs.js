const {default : mongoose, Schema} = require("mongoose")

// const contentSchema = new Schema({
//     content : {
//         type : String,
//     },
//     image : [{
//         type : Object,
//     }],
// })

const blogsSchema = new Schema({
    mainCategory : {
        type : String,
    },
    categoryId : {
        type : mongoose.Schema.Types.ObjectId,
    },
    admin : {
        type : mongoose.Schema.Types.ObjectId,
    },
    selectDate : {
        type : String,
        default: "",
    },
    title : {
        type : String,
        required : true,
    },
    tags : [{
        type : mongoose.Schema.Types.ObjectId
    }],
    subCategory : {
        type : mongoose.Schema.Types.ObjectId,
    },
    logo : {
        type : String,
    },
    featured : {
        type : Boolean,
        default : false,

    },
    status : {
        type : String,
        enum : ["draft", "publish"],
        default : "publish",
    },
    content  : {
        type : String,
    }, 
    meta : {
        type : String,
    },
    slug : {
        type : String,
    },
    youtubeLink : {
        type : String,
    },
},
{timestamps : true},
)

const Blogs = mongoose.model("blog",blogsSchema)
module.exports = Blogs