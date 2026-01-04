const { model, default: mongoose, Schema } = require("mongoose")
const otpSchema = new Schema({
    id: String,
    name: String,
    isDeleted: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

module.exports = model('country', otpSchema);