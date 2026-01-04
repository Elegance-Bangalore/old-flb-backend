const Campaign = require("../model/campaign");
const CampaignDownload = require("../model/campaignDownload.model");
const AWS = require("aws-sdk");
const { default: mongoose } = require("mongoose");

const awsConfig = {
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
  apiVersion: process.env.AWS_API_VERSION,
};

const S3 = new AWS.S3(awsConfig);

// Create a new campaign
const createCampaign = async (req, res) => {
  console.log("enter in camp page........................")
  try {
    const { title, description, pdfButtonName, imageButtonName, status, startDate, endDate, priority } = req.body;
    const adminId = req.user._id;

    // Handle file uploads
    let pdfFileUrl = null;
    let backgroundImageUrl = null;

    if (req.files && req.files.pdfFile) {
      const pdfFile = req.files.pdfFile[0];
      const fileName = pdfFile.originalname.replace(/\s/g, "");
      const params = {
        Bucket: "flb-public",
        Key: `campaigns/pdfs/${Date.now()}-${fileName}`,
        Body: pdfFile.buffer,
        ContentType: pdfFile.mimetype,
      };
      const pdfResult = await S3.upload(params).promise();
      pdfFileUrl = pdfResult.Location;
    }

    if (req.files && req.files.backgroundImage) {
      const imageFile = req.files.backgroundImage[0];
      const fileName = imageFile.originalname.replace(/\s/g, "");
      const params = {
        Bucket: "flb-public",
        Key: `campaigns/images/${Date.now()}-${fileName}`,
        Body: imageFile.buffer,
        ContentType: imageFile.mimetype,
      };
      const imageResult = await S3.upload(params).promise();
      backgroundImageUrl = imageResult.Location;
    }

    const campaignData = {
      title,
      description,
      pdfButtonName,
      imageButtonName,
      pdfFile: pdfFileUrl,
      backgroundImage: backgroundImageUrl,
      admin: adminId,
      status: status || "active",
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      priority: priority || 0
    };

    const campaign = new Campaign(campaignData);
    await campaign.save();

    res.status(201).json({
      success: true,
      message: "Campaign created successfully",
      data: campaign
    });
  } catch (error) {
    console.error("Error creating campaign:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create campaign",
      error: error.message
    });
  }
};

// Get all campaigns with pagination and filtering
const getCampaigns = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, search } = req.query;
    const skip = (page - 1) * limit;

    let filter = {};
    if (status) {
      filter.status = status;
    }
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } }
      ];
    }

    const campaigns = await Campaign.find(filter)
      .populate("admin", "fullName email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Campaign.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: campaigns,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error("Error fetching campaigns:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch campaigns",
      error: error.message
    });
  }
};

// Get campaign by ID
const getCampaignById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid campaign ID"
      });
    }

    const campaign = await Campaign.findById(id).populate("admin", "fullName email");

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: "Campaign not found"
      });
    }

    res.status(200).json({
      success: true,
      data: campaign
    });
  } catch (error) {
    console.error("Error fetching campaign:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch campaign",
      error: error.message
    });
  }
};

// Update campaign
const updateCampaign = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid campaign ID"
      });
    }

    // Handle file uploads if provided
    if (req.files && req.files.pdfFile) {
      const pdfFile = req.files.pdfFile[0];
      const fileName = pdfFile.originalname.replace(/\s/g, "");
      const params = {
        Bucket: "flb-public",
        Key: `campaigns/pdfs/${Date.now()}-${fileName}`,
        Body: pdfFile.buffer,
        ContentType: pdfFile.mimetype,
      };
      const pdfResult = await S3.upload(params).promise();
      updateData.pdfFile = pdfResult.Location;
    }

    if (req.files && req.files.backgroundImage) {
      const imageFile = req.files.backgroundImage[0];
      const fileName = imageFile.originalname.replace(/\s/g, "");
      const params = {
        Bucket: "flb-public",
        Key: `campaigns/images/${Date.now()}-${fileName}`,
        Body: imageFile.buffer,
        ContentType: imageFile.mimetype,
      };
      const imageResult = await S3.upload(params).promise();
      updateData.backgroundImage = imageResult.Location;
    }

    const campaign = await Campaign.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate("admin", "fullName email");

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: "Campaign not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Campaign updated successfully",
      data: campaign
    });
  } catch (error) {
    console.error("Error updating campaign:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update campaign",
      error: error.message
    });
  }
};

// Delete campaign
const deleteCampaign = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid campaign ID"
      });
    }

    const campaign = await Campaign.findByIdAndDelete(id);

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: "Campaign not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Campaign deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting campaign:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete campaign",
      error: error.message
    });
  }
};

// Update campaign status
const updateCampaignStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid campaign ID"
      });
    }

    const campaign = await Campaign.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: "Campaign not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Campaign status updated successfully",
      data: campaign
    });
  } catch (error) {
    console.error("Error updating campaign status:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update campaign status",
      error: error.message
    });
  }
};

// Get campaign analytics
const getCampaignAnalytics = async (req, res) => {
  try {
    const totalCampaigns = await Campaign.countDocuments();
    const activeCampaigns = await Campaign.countDocuments({ status: "active" });
    const inactiveCampaigns = await Campaign.countDocuments({ status: "inactive" });
    const draftCampaigns = await Campaign.countDocuments({ status: "draft" });

    // Get campaigns with highest clicks and views
    const topCampaigns = await Campaign.find()
      .sort({ clicks: -1, views: -1 })
      .limit(5)
      .select("title clicks views status");

    res.status(200).json({
      success: true,
      data: {
        totalCampaigns,
        activeCampaigns,
        inactiveCampaigns,
        draftCampaigns,
        topCampaigns
      }
    });
  } catch (error) {
    console.error("Error fetching campaign analytics:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch campaign analytics",
      error: error.message
    });
  }
};

// Test endpoint to debug request
const testDownloadRequest = async (req, res) => {
  try {
    console.log('Test endpoint - Request body:', req.body);
    console.log('Test endpoint - Request headers:', req.headers);
    console.log('Test endpoint - Request method:', req.method);
    console.log('Test endpoint - Request URL:', req.url);
    
    res.status(200).json({
      success: true,
      message: 'Test endpoint working',
      received: {
        body: req.body,
        method: req.method,
        url: req.url,
        headers: req.headers
      }
    });
  } catch (error) {
    console.error('Test endpoint error:', error);
    res.status(500).json({
      success: false,
      message: 'Test endpoint error',
      error: error.message
    });
  }
};

// Track campaign download request
const trackDownloadRequest = async (req, res) => {
  try {
    console.log('Download request body:', req.body);
    console.log('Download request headers:', req.headers);
    
    const { campaignId, userName, userEmail, downloadDate } = req.body;
    
    // Debug what we received
    console.log('Extracted fields:', { campaignId, userName, userEmail, downloadDate });
    console.log('downloadDate type:', typeof downloadDate, 'value:', downloadDate);
    
    // Alert campaign ID when download is clicked
    console.log(`🚨 DOWNLOAD ALERT: Campaign ID ${campaignId} download requested by ${userName} (${userEmail})`);
    
    // Validate required fields
    if (!campaignId || !userName || !userEmail) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: campaignId, userName, userEmail',
        received: { campaignId, userName, userEmail, downloadDate }
      });
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }
    
    // Check if campaign exists
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found'
      });
    }
    
    // Determine the download date to use
    const finalDownloadDate = downloadDate && downloadDate !== 'undefined' && downloadDate !== null ? new Date(downloadDate) : new Date();
    console.log('Final downloadDate to be saved:', finalDownloadDate);
    
    // Save download request
    const downloadRequest = new CampaignDownload({
      campaignId: campaignId,
      userName: userName,
      userEmail: userEmail,
      downloadDate: finalDownloadDate,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent')
    });
    
    await downloadRequest.save();
    
    // Update campaign download count (optional)
    await Campaign.findByIdAndUpdate(campaignId, { $inc: { downloads: 1 } });
    
    // Additional alert after successful save
    console.log(`✅ DOWNLOAD SAVED: Campaign ID ${campaignId} - Download ID: ${downloadRequest._id}`);
    
    res.status(201).json({
      success: true,
      message: `Download request saved successfully for Campaign ID: ${campaignId}`,
      data: downloadRequest,
      alert: {
        campaignId: campaignId,
        downloadId: downloadRequest._id,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('Error saving download request:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get campaign download stats
const getCampaignDownloadStats = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate campaign ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid campaign ID'
      });
    }
    
    // Check if campaign exists
    const campaign = await Campaign.findById(id);
    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found'
      });
    }
    
    // Get download stats
    const totalDownloads = await CampaignDownload.countDocuments({ campaignId: id });
    const uniqueDownloaders = await CampaignDownload.distinct('userEmail', { campaignId: id }).then(emails => emails.length);
    
    // Get downloads per day
    const downloadsPerDay = await CampaignDownload.aggregate([
      { $match: { campaignId: new mongoose.Types.ObjectId(id) } },
      {
        $group: {
          _id: {
            year: { $year: '$downloadDate' },
            month: { $month: '$downloadDate' },
            day: { $dayOfMonth: '$downloadDate' }
          },
          downloads: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          date: {
            $dateFromParts: {
              year: '$_id.year',
              month: '$_id.month',
              day: '$_id.day'
            }
          },
          downloads: 1
        }
      },
      { $sort: { date: -1 } }
    ]);
    
    // Get recent downloads
    const recentDownloads = await CampaignDownload.find({ campaignId: id })
      .sort({ downloadDate: -1 })
      .limit(10)
      .select('userName userEmail downloadDate ipAddress');
    
    res.status(200).json({
      success: true,
      data: {
        campaignId: id,
        totalDownloads,
        uniqueDownloaders,
        downloadsPerDay,
        recentDownloads
      }
    });
    
  } catch (error) {
    console.error('Error fetching download stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching download stats',
      error: error.message
    });
  }
};

// Get all campaign downloads with pagination and filtering
const getAllCampaignDownloads = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      pageSize = 10, // Handle both limit and pageSize
      campaignId, 
      userEmail, 
      startDate, 
      endDate,
      sortBy = 'downloadDate',
      sortOrder = 'desc'
    } = req.query;
    
    // Ensure page is at least 1 and limit is positive
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.max(1, parseInt(limit || pageSize) || 10);
    const skip = (pageNum - 1) * limitNum;
    
    // Debug pagination values
    console.log('Pagination debug:', { 
      originalPage: page, 
      originalLimit: limit, 
      pageNum, 
      limitNum, 
      skip 
    });
    
    // Build filter object
    let filter = {};
    
    if (campaignId) {
      if (!mongoose.Types.ObjectId.isValid(campaignId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid campaign ID'
        });
      }
      filter.campaignId = campaignId;
    }
    
    if (userEmail) {
      filter.userEmail = { $regex: userEmail, $options: 'i' };
    }
    
    if (startDate || endDate) {
      filter.downloadDate = {};
      if (startDate) {
        filter.downloadDate.$gte = new Date(startDate);
      }
      if (endDate) {
        filter.downloadDate.$lte = new Date(endDate);
      }
    }
    
    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    
    // Get downloads with pagination
    const downloads = await CampaignDownload.find(filter)
      .populate('campaignId', 'title status')
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .select('-__v');
    
    // Get total count for pagination
    const total = await CampaignDownload.countDocuments(filter);
    
    // Get summary stats
    const totalDownloads = await CampaignDownload.countDocuments();
    const uniqueUsers = await CampaignDownload.distinct('userEmail').then(emails => emails.length);
    const totalCampaigns = await CampaignDownload.distinct('campaignId').then(ids => ids.length);
    
    res.status(200).json({
      success: true,
      data: downloads,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        totalItems: total,
        itemsPerPage: limitNum
      },
      summary: {
        totalDownloads,
        uniqueUsers,
        totalCampaigns
      }
    });
    
  } catch (error) {
    console.error('Error fetching campaign downloads:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching campaign downloads',
      error: error.message
    });
  }
};

// Get download analytics for admin dashboard
const getDownloadAnalytics = async (req, res) => {
  try {
    const { period = '30' } = req.query; // days
    const days = parseInt(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    // Get downloads in the specified period
    const downloadsInPeriod = await CampaignDownload.countDocuments({
      downloadDate: { $gte: startDate }
    });
    
    // Get downloads by campaign
    const downloadsByCampaign = await CampaignDownload.aggregate([
      { $match: { downloadDate: { $gte: startDate } } },
      {
        $group: {
          _id: '$campaignId',
          downloads: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'campaigns',
          localField: '_id',
          foreignField: '_id',
          as: 'campaign'
        }
      },
      {
        $unwind: '$campaign'
      },
      {
        $project: {
          campaignId: '$_id',
          campaignTitle: '$campaign.title',
          downloads: 1
        }
      },
      { $sort: { downloads: -1 } }
    ]);
    
    // Get downloads by day
    const downloadsByDay = await CampaignDownload.aggregate([
      { $match: { downloadDate: { $gte: startDate } } },
      {
        $group: {
          _id: {
            year: { $year: '$downloadDate' },
            month: { $month: '$downloadDate' },
            day: { $dayOfMonth: '$downloadDate' }
          },
          downloads: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          date: {
            $dateFromParts: {
              year: '$_id.year',
              month: '$_id.month',
              day: '$_id.day'
            }
          },
          downloads: 1
        }
      },
      { $sort: { date: -1 } }
    ]);
    
    // Get top downloaders
    const topDownloaders = await CampaignDownload.aggregate([
      { $match: { downloadDate: { $gte: startDate } } },
      {
        $group: {
          _id: '$userEmail',
          downloads: { $sum: 1 },
          userName: { $first: '$userName' }
        }
      },
      { $sort: { downloads: -1 } },
      { $limit: 10 }
    ]);
    
    res.status(200).json({
      success: true,
      data: {
        period: `${days} days`,
        totalDownloads: downloadsInPeriod,
        downloadsByCampaign,
        downloadsByDay,
        topDownloaders
      }
    });
    
  } catch (error) {
    console.error('Error fetching download analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching download analytics',
      error: error.message
    });
  }
};

module.exports = {
  createCampaign,
  getCampaigns,
  getCampaignById,
  updateCampaign,
  deleteCampaign,
  updateCampaignStatus,
  getCampaignAnalytics,
  trackDownloadRequest,
  getCampaignDownloadStats,
  getAllCampaignDownloads,
  getDownloadAnalytics,
  testDownloadRequest
};

