const {model, Schema} = require('mongoose');
const otpSchema = new Schema({
    phone:String,
    phoneOtp:String,
    isDeleted:{
        type:Boolean,
        default:false
    }
}, {timestamps:true});

module.exports = model('otp_users',otpSchema);