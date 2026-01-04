const AWS = require("aws-sdk");
const { nanoid } = require("nanoid");
const { log } = require("console");
const { readFileSync } = require("fs");

const awsConfig = {
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
  apiVersion: process.env.AWS_API_VERSION,
};

exports.isBase64Uri = async (str) => {
  // Step 1: Check if the string is a valid URI
  try {
    decodeURIComponent(str);
  } catch (error) {
    return false; // Invalid URI
  }

  // Step 2: Extract the Base64 string from the URI component
  const base64String = str.replace(/^data:image\/\w+;base64,/, "");

  // Step 3: Validate if the decoded string is in Base64 format
  const isValidBase64 = /^[A-Za-z0-9+/=]+$/i.test(base64String);

  return isValidBase64;
};

const S3 = new AWS.S3(awsConfig);
/**
 * Retrieves a image URI
 * @function uploadImage
 * @param {string} image Image URI
 * @returns {object} object from AWS
 */

exports.uploadImage = async function (image) {
  try {
    // prepare the image
    const base64Data = Buffer.from(
      image.replace(/^data:image\/\w+;base64,/, ""),
      "base64"
    );

    
    //console.log(image);

    //const type = image.split(";")[0].split("/")[1].split(".")[0];
    // const type = image.split(";")[0].endsWith(".image")
    //   ? image.split(";")[0].split(".image")[1]
    //   : "";
    const type = image.split(";")[0].split("/")[1];

    //const type = image.split(".").pop();

    //console.log(type);

    // image params

    const params = {
      Bucket: "flb-public",
      Key: `${nanoid()}.${type}`,
      Body: base64Data,
      //ACL: "public-read",
      ContentEncoding: "base64",
      ContentType: `image/${type}`,
    };

    const s3upload = await S3.upload(params, (err, data) => {
      if (err) {
        console.log(err);
        throw new Error(err);
      }
    }).promise();

    return s3upload;
  } catch (err) {
    throw new Error(err);
  }
};

exports.uploadPDF = async function (base64Data) {
  try {
    // Extract the MIME type from the base64 data
    const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,/);
    if (!matches || matches.length !== 2) {
      throw new Error('Invalid base64 data');
    }
    
    const mimeType = matches[1];
    const base64Content = base64Data.replace(/^data:[A-Za-z-+\/]+;base64,/, '');
    const binaryData = Buffer.from(base64Content, 'base64');

    // Determine file extension based on MIME type
    const mimeTypeToExt = {
      'application/pdf': 'pdf',
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/gif': 'gif',
      // Add more MIME types and their corresponding extensions if needed
    };

    const fileExtension = mimeTypeToExt[mimeType];
    if (!fileExtension) {
      throw new Error('Unsupported file type');
    }

    // Set S3 upload parameters
    const params = {
      Bucket: "flb-public",
      Key: `${nanoid()}.${fileExtension}`,
      Body: binaryData,
      ContentType: mimeType,
    };

    const s3upload = await S3.upload(params).promise();

    return s3upload;
  } catch (err) {
    throw new Error(err);
  }
};

// exports.uploadPDF = async function (base64Data) {
//   try {
//     // prepare the image
//     const base64Content = base64Data.replace(/^data:application\/pdf;base64,/, '');
//     const binaryData = Buffer.from(base64Content, "base64");

//     //console.log(image);

//     //const type = image.split(";")[0].split("/")[1].split(".")[0];
//     // const type = image.split(";")[0].endsWith(".image")
//     //   ? image.split(";")[0].split(".image")[1]
//     //   : "";
//     // Get the file type from the base64 data
//     const type = base64Data.split(";")[0].split("/")[1];

//     // Set S3 upload parameters
//     const params = {
//       Bucket: "flb-public",
//       Key: `${nanoid()}.${type}`,
//       Body: binaryData,
//       //ACL: "public-read",
//       ContentEncoding: "base64",
//       ContentType: `application/pdf`, 
//     };

//     const s3upload = await S3.upload(params, (err, data) => {
//       if (err) {
//         console.log(err);
//         throw new Error(err);
//       }
//     }).promise();

//     return s3upload;
//   } catch (err) {
//     throw new Error(err);
//   }
// };

exports.isBase64Uri = async (str) => {
  try {
    decodeURIComponent(str);
  } catch (error) {
    return false; // Invalid URI
  }

  const base64String = str.replace(/^data:video\/\w+;base64,/, "");
  const isValidBase64 = /^[A-Za-z0-9+/=]+$/i.test(base64String);

  return isValidBase64;
};

/**
 * Uploads a video to AWS S3 bucket
 * @param {string} video Base64 encoded video data
 * @returns {Promise<object>} Uploaded video object details from AWS
 */
exports.uploadVideo = async function (video) {
  try {
    const base64Data = Buffer.from(
      video.replace(/^data:video\/\w+;base64,/, ""),
      "base64"
    );

    const type = video.split(";")[0].split("/")[1];

    const params = {
      Bucket: "flb-public",
      Key: `${nanoid()}.${type}`,
      Body: base64Data,
      //ACL: "public-read",
      ContentEncoding: "base64",
      ContentType: `video/${type}`,
    };

    const s3Upload = await S3.upload(params).promise();

    return s3Upload;
  } catch (err) {
    throw new Error(err);
  }
};
