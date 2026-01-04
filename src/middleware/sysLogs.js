const SysLog = require("../model/sysLogs");
const axios = require("axios");
const requestIp = require("request-ip");

exports.sysLog = async (req, res, next) => {
  try {
    // getting api req for IP
    const { data: ipAddress } = await axios.get(
      "http://www.geoplugin.net/json.gp"
    );

    let buyerId = req.user?._id;
    const item = {
      location: {
        ip: ipAddress?.geoplugin_request || "",
        locality: ipAddress?.geoplugin_city || "",
        countryCode: ipAddress?.geoplugin_countryCode || "",
        countryName: ipAddress?.geoplugin_countryName || "",
        principalSubdivision: ipAddress?.geoplugin_regionName || "",
        longitude: 0,
        latitude: 0,
      },
      buyerId,
      method: req.method || "",
      url: req.protocol + '://' + req.get('host') + req.originalUrl || "",
      action_date: new Date(),
    };

    const sys = await new SysLog(item).save();

    return next();
  } catch (err) {
    console.log(err);
    return res.status(500).send("Internal server error");
  }
};