
const { model, default: mongoose, Schema } = require("mongoose")
const otpSchema = new Schema({
    id: String,
    country_id: String,
    name: String,
    isDeleted: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

module.exports = model('state', otpSchema);