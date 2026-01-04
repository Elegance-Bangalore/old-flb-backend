const {default : mongoose, Schema} = require("mongoose")

const bannerClicksSchema = new Schema({
    bannerId : {
        type : mongoose.Schema.Types.ObjectId
    },
    userId : {
        type : mongoose.Schema.Types.ObjectId
    },
    uniqueIdentifier: {
        type: String, 
        default: null,
      },
},
{timestamps : true})

const BannerClicks = mongoose.model("bannerClicks", bannerClicksSchema);
module.exports = BannerClicks