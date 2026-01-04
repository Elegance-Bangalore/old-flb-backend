const {default : mongoose, Schema} = require("mongoose")

const campaignSchema = new Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    pdfButtonName: {
        type: String,
        required: true,
        trim: true
    },
    imageButtonName: {
        type: String,
        required: true,
        trim: true
    },
    pdfFile: {
        type: String, // URL to the uploaded PDF file
        default: null
    },
    backgroundImage: {
        type: String, // URL to the uploaded background image
        default: null
    },
    admin: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'sellers', // Reference to the admin who created the campaign
        required: true
    },
    status: {
        type: String,
        enum: ["active", "inactive", "draft"],
        default: "active"
    },
    isActive: {
        type: Boolean,
        default: true
    },
    // Additional fields for campaign management
    startDate: {
        type: Date,
        default: null
    },
    endDate: {
        type: Date,
        default: null
    },
    priority: {
        type: Number,
        default: 0 // Higher number = higher priority
    },
    clicks: {
        type: Number,
        default: 0
    },
    views: {
        type: Number,
        default: 0
    },
    downloads: {
        type: Number,
        default: 0
    }
},
{
    timestamps: true
});

// Index for better query performance
campaignSchema.index({ status: 1, isActive: 1 });
campaignSchema.index({ admin: 1 });
campaignSchema.index({ createdAt: -1 });

const Campaign = mongoose.model("campaign", campaignSchema);
module.exports = Campaign;
