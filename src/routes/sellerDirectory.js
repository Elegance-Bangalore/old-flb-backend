const express = require("express");
const router = express.Router();
const multer = require('multer');
const upload = multer();

const ctrl = require("../controller/sellerDirectory");
const { verifyJwtToken, verifyOptionalJwtToken } = require("../utils/token.utils");

router.patch("/markFeatured/:sellerId", verifyJwtToken, ctrl.markSellerFeatured)
router.get("/feturedSellers", ctrl.getFeaturedSellers)
router.get("/sellerDirectory", ctrl.getSellerDirectory)

//upload files
router.post('/uploadFiles', upload.array('files'), ctrl.uploadMultipleFiles);


module.exports = router