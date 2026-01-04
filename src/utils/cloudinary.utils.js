const cloudinary = require("cloudinary").v2;

// configuring cloudinary
cloudinary.config({
  cloud_name: "dd7lihgvm",
  api_key: "247815895662816",
  api_secret: "GHtlGNP_yWtIFWgnFgJShMj1MJY",
  secure: true,
});
module.exports = cloudinary;