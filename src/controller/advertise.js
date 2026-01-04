const Advertise = require("../model/advertise");

exports.requestAdverisement = async (req, res) => {
  try {
    const {
      fullName,
      designation,
      companyName,
      cityOfHeadQuarter,
      businessEmailAddress,
      mobileNumber,
      spaceRequirement,
      description,
    } = req.body;
    if (
      !fullName ||
      !designation ||
      !companyName ||
      !cityOfHeadQuarter ||
      !businessEmailAddress ||
      !mobileNumber ||
      !spaceRequirement ||
      !description
    ) {
      return res.status(400).send({ error: "All Fields are required" });
    }
    const advertise = {
      companyName,
      cityOfHeadQuarter,
      businessEmailAddress,
      mobileNumber,
      spaceRequirement,
      description,
    };
    await Advertise.create(advertise);
    return res.status(200).send({ advertise, message: "Advertise Requested" });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ error: "Something went wrong" });
  }
};

exports.getAdvertise = async (req, res) => {
  try {
    const page = parseInt(req.query.page);
    const limit = parseInt(req.query.limit);
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const advertise = await Advertise.find()
      .skip(startIndex)
      .limit(limit)
      .sort({ createdAt: -1 });
    const totalAdvertise = await Advertise.countDocuments().exec();
    return res
      .status(200)
      .send({
        advertise,
        totalCount: totalAdvertise,
        message: "Advertise Fetched",
      });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ error: "Something went wrong" });
  }
};
