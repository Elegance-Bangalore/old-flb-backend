const {model, Schema} = require('mongoose');
const activityTrackerSchema = new Schema({
    userId : String,
    deviceIp : String,
    browserInfo:String,
    loginAt:Number,
    email:String,
    fullName:String,
    propertyPostDate : String,
});

module.exports = model('activity_trackers',activityTrackerSchema);