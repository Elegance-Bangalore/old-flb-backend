const { default: mongoose, Schema } = require("mongoose");

const campaignDownloadSchema = new Schema({
  campaignId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'campaign',
    required: true
  },
  userName: {
    type: String,
    required: true,
    trim: true
  },
  userEmail: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  downloadDate: {
    type: Date,
    default: Date.now
  },
  ipAddress: {
    type: String,
    default: null
  },
  userAgent: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Indexes for better query performance
campaignDownloadSchema.index({ campaignId: 1 });
campaignDownloadSchema.index({ userEmail: 1 });
campaignDownloadSchema.index({ downloadDate: 1 });
campaignDownloadSchema.index({ campaignId: 1, downloadDate: 1 });

const CampaignDownload = mongoose.model("campaignDownload", campaignDownloadSchema);
module.exports = CampaignDownload;
