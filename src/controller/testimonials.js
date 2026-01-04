const Testimonial = require("../model/testimonials");
const {
  validateId,
  validateFound,
  validateFields,
} = require("../utils/commonValidations");
const {
  uploadImage,
  uploadVideo,
  uploadPDF,
} = require("../utils/conrollerUtils");
const MediaLink = require("../model/mediaLink");

exports.addTestimonial = async (req, res) => {
  try {
    const user = req.user._id;
    const { name, type, description, image, youTubeLink, ratings, status } = req.body;
    const data = {
      name: name,
      type: type,
      description: description,
      image: image,
      youTubeLink: youTubeLink,
      ratings : ratings,
      status : status,
      addBy: user,
    };
    const testimonial = await Testimonial.create(data);
    res.status(201).send({
      testimonial: testimonial,
      message: "Testimonial Created Successfully",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ error: "Something broke!" });
  }
};

exports.updateTestimonial = async (req, res) => {
  try {
    const user = req.user._id;
    const testimonialId = req.params.testimonialId;
    if (!testimonialId) {
      return validateId(res);
    }
    const testimonial = await Testimonial.findById(testimonialId);
    if (!testimonial) {
      return validateFound(res);
    }
    const { name, type, description, image, youTubeLink, ratings, status } = req.body;
    if (name) {
      testimonial.name = name;
    }
    if (type) {
      testimonial.type = type;
    }
    if (description) {
      testimonial.description = description;
    }
    if (image) {
      testimonial.image = image;
    }
    if (youTubeLink) {
      testimonial.youTubeLink = youTubeLink;
    }
    if(ratings){
      testimonial.ratings = ratings;
    }
    if(status){
      testimonial.status = status;
    }
    await testimonial.save();
    return res.status(200).send({
      testimonial: testimonial,
      success: "Testimonial updated successfully",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ error: "Something broke!" });
  }
};

exports.getTestimonial = async (req, res) => {
  try {
    const testimonialId = req.params.testimonialId;
    if (!testimonialId) {
      return validateId(res);
    }
    const testimonial = await Testimonial.findById(testimonialId).populate({
      path: "addBy",
      model: "sellers" ? "sellers" : "user",
    });
    if (!testimonial) {
      return validateFound(res);
    }
    return res.status(200).send({ testimonial: testimonial });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ error: "Something broke!" });
  }
};

exports.getAllTestimonials = async (req, res) => {
  try {
    const page = parseInt(req.query.page);
    const limit = parseInt(req.query.limit);
    let startIndex = (page - 1) * limit;
    let endIndex = page * limit;

    let result = {};

    const totalCount = await Testimonial.countDocuments().exec();

    if (endIndex < totalCount) {
      result.next = {
        page: page + 1,
        limit: limit,
      };
    }

    if (startIndex > 0) {
      result.previous = {
        page: page - 1,
        limit: limit,
      };
    }

    const testimonials = await Testimonial.find()
      .populate({
        path: "addBy",
        model: "sellers" ? "sellers" : "user",
      })
      .skip(startIndex)
      .limit(limit);
    return res
      .status(200)
      .send({ testimonials: testimonials, count: totalCount });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ error: "Something broke!" });
  }
};

exports.deleteTestimonial = async (req, res) => {
  try {
    const testimonialId = req.params.testimonialId;
    if (!testimonialId) {
      return validateId(res);
    }
    const testimonial = await Testimonial.findById(testimonialId);
    if (!testimonial) {
      return validateFound(res);
    }
    await Testimonial.findByIdAndDelete(testimonialId);
    return res
      .status(200)
      .send({ success: "Testimonial deleted successfully" });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ error: "Something broke!" });
  }
};

exports.addMediaLink = async (req, res) => {
  try {
    const user = req.user._id;
    const { link, mediaImage } = req.body;

    let mediaImageUrl = "";

    if (mediaImage) {
      const mediaImageResult = await uploadImage(mediaImage);
      mediaImageUrl = mediaImageResult.Location;
    }

    const data = {
      link: link,
      admin: user,
      mediaImage: mediaImageUrl,
    };

    const mediaLink = await MediaLink.create(data);

    return res.status(201).send({
      mediaLink: mediaLink,
      message: "Media Link Created Successfully",
    });
  } catch (error) {
    console.error("Failed to create media link:", error);
    return res.status(500).send({ error: "Internal Server Error" });
  }
};

exports.updateMediaLink = async (req, res) => {
  try {
    const user = req.user._id;
    let mediaId = req.params.mediaId;
    if (!mediaId) {
      return validateId(res);
    }
    const media = await MediaLink.findById(mediaId);
    if (!media) {
      return validateFound(res);
    }
    const { link, mediaImage } = req.body;
    const re = new RegExp("^(http|https)://", "i");

    if (link) {
      media.link = link;
    }

    let mediaImageUrl = "";

    if (mediaImage && !re.test(mediaImage)) {
      const mediaImageResult = await uploadImage(mediaImage);
      mediaImageUrl = mediaImageResult.Location;
    }

    if (mediaImageUrl !== "") {
      media.mediaImage = mediaImageUrl;
    }
    await media.save();

    return res.status(200).send({
      mediaLink: media,
      message: "Successfully updated",
    });
  } catch (error) {
    console.error("Failed to create media link:", error);
    return res.status(500).send({ error: "Internal Server Error" });
  }
};

exports.getMediaLink = async (req, res) => {
  try {
    const mediaId = req.params.mediaId;
    if (!mediaId) {
      return validateId(res);
    }
    const media = await MediaLink.findById(mediaId).populate({
      path: "admin",
      model: "sellers" ? "sellers" : "user",
    });
    if (!media) {
      return validateFound(res);
    }
    return res
      .status(200)
      .send({ media: media, message: "Successfully fetched" });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ error: "Something broke!" });
  }
};

exports.getAllMediaLink = async (req, res) => {
  try {
    const page = parseInt(req.query.page);
    const limit = parseInt(req.query.limit);
    let startIndex = (page - 1) * limit;
    let endIndex = page * limit;

    let result = {};

    const totalCount = await MediaLink.countDocuments().exec();

    if (endIndex < totalCount) {
      result.next = {
        page: page + 1,
        limit: limit,
      };
    }

    if (startIndex > 0) {
      result.previous = {
        page: page - 1,
        limit: limit,
      };
    }

    const media = await MediaLink.find()
      .populate({
        path: "admin",
        model: "sellers" ? "sellers" : "user",
      })
      .skip(startIndex)
      .limit(limit);
    return res
      .status(200)
      .send({ media: media, count: totalCount });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ error: "Something broke!" });
  }
};

exports.deleteMediaLink = async (req, res) => {
  try {
    const mediaId = req.params.mediaId;
    if (!mediaId) {
      return validateId(res);
    }
    const media = await MediaLink.findById(mediaId);
    if (!media) {
      return validateFound(res);
    }
    await MediaLink.findByIdAndDelete(mediaId);
    return res
      .status(200)
      .send({ success: "Media Link deleted successfully" });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ error: "Something broke!" });
  }
};