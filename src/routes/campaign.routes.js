const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const {
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
} = require("../controller/campaign.controller");
const { verifyJwtToken } = require("../utils/token.utils");

// Configure multer for file uploads (memory storage for S3 uploads)
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (file.fieldname === 'pdfFile') {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed for PDF upload'), false);
    }
  } else if (file.fieldname === 'backgroundImage') {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed for background image'), false);
    }
  } else {
    cb(new Error('Unexpected field'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  }
});

// Middleware to handle multer errors
const handleMulterError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File size too large. Maximum size is 10MB.'
      });
    }
  }
  if (error.message.includes('Only PDF files are allowed') || 
      error.message.includes('Only image files are allowed')) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
  next(error);
};

// Apply authentication middleware to all routes
router.use(verifyJwtToken);

// Campaign routes
router.post("/", upload.fields([
  { name: 'pdfFile', maxCount: 1 },
  { name: 'backgroundImage', maxCount: 1 }
]), handleMulterError, createCampaign);

router.get("/", getCampaigns);
router.get("/analytics", getCampaignAnalytics);

// Download tracking routes (no authentication required for public downloads)
router.post("/test-download", testDownloadRequest);
router.post("/download-request", trackDownloadRequest);

// Admin routes for viewing download data
router.get("/downloads", getAllCampaignDownloads);
router.get("/downloads/analytics", getDownloadAnalytics);
router.get("/:id/download-stats", getCampaignDownloadStats);
router.get("/:id", getCampaignById);
router.put("/:id", upload.fields([
  { name: 'pdfFile', maxCount: 1 },
  { name: 'backgroundImage', maxCount: 1 }
]), handleMulterError, updateCampaign);
router.patch("/:id/status", updateCampaignStatus);
router.delete("/:id", deleteCampaign);

module.exports = router;

