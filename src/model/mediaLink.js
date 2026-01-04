const {default : mongoose, Schema } = require("mongoose");

const mediaLinkSchema = new Schema({
    admin : {
        type : mongoose.Schema.Types.ObjectId,
        ref: "sellers"
    },
    link: {
        type: String,
    },
    mediaImage: {
        type: String,
    }
},
{timestamps : true}
);

const MediaLink = mongoose.model("medialink", mediaLinkSchema);
module.exports = MediaLink