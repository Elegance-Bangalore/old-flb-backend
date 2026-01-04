const Banner = require("../model/banner");
const Property = require("../model/property.model");
const BannerClicks = require("../model/bannerClicks");
const Carousel = require("../model/carousel");
const mongoose = require("mongoose");
const { validateFields } = require("../utils/commonValidations");
const axios = require("axios");
const crypto = require("crypto");
const geolib = require("geolib");
const { checkAdmin } = require("../validators/adminAuth");
const {
  uploadImage,
  uploadVideo,
  uploadPDF,
} = require("../utils/conrollerUtils");

const modelName = "cities";
let City;
if (mongoose.models[modelName]) {
  City = mongoose.models[modelName];
} else {
  const citySchema = new mongoose.Schema(
    {},
    { strict: false, timestamps: true }
  );
  City = mongoose.model(modelName, citySchema);
}

exports.addBanner = async (req, res) => {
  try {
    const user = req.user?._id;
    const { banner, type, propertyType, status, city, bannerType, url, propertyId } =
      req.body;
    if (!banner || !type || !bannerType) {
      return validateFields(res);
    }
    let re = new RegExp("^(http|https)://", "i");

    let bannerResult = await uploadImage(banner);
    let banners = bannerResult.Location;

    const data = {
      type,
      propertyType,
      status,
      city,
      bannerType,
      url,
      propertyId,
      admin: user,
    };
    data.banner = banners;
    const bannerData = await Banner.create(data);
    return res
      .status(201)
      .send({ banner: bannerData, message: "Banner added successfully" });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ error: "Someting broke!" });
  }
};

exports.updateBanner = async (req, res) => {
  console.log(req.body, "-------------")

  try {
    const bannerId = req.params.bannerId;
    const Banners = await Banner.findById(bannerId);
    if (!Banners) {
      return res.status(404).send({ message: "Banner not found" });
    }
    const { banner, type, propertyType, status, city, bannerType, url, propertyId } =
      req.body;
    let re = new RegExp("^(http|https)://", "i");
    if (banner && !re.test(banner)) {
      let bannerResult = await uploadImage(banner);
      data = bannerResult.Location;
    }
    Banners.data = banner;
    if (type) {
      Banners.type = type;
    }
    if (propertyType) {
      Banners.propertyType = propertyType;
    }
    if (status) {
      Banners.status = status;
    }
    if (city) {
      Banners.city = city;
    }
    if (bannerType) {
      Banners.bannerType = bannerType;
    }
    if (url) {
      Banners.url = url;
    }
    if(propertyId){
      Banners.propertyId = propertyId
    }

    if (banner) {
      let re = new RegExp("^(http|https)://", "i");
      if (!re.test(banner)) {
        const bannerResult = await uploadImage(banner);
        Banners.banner = bannerResult.Location;
      } else {
        Banners.banner = banner;
      }
    }
    



    const bannerData = await Banners.save();
    return res
      .status(200)
      .send({ banner: bannerData, message: "Banner updated successfully" });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ error: "Someting broke!" });
  }
};

exports.getBanners = async (req, res) => {
  console.log("hi enter in this ")
  try {
    const page = parseInt(req.query.page);
    const limit = parseInt(req.query.limit);
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;

    let result = {};

    // If requester is admin, return full paginated list across all cities
    try {
      const { isAdmin } = await checkAdmin(req, res);
      if (isAdmin) {
        const totalCount = await Banner.countDocuments();

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

        const banners = await Banner.find({})
          .sort({ createdAt: -1 })
          .populate({
            path: "admin",
            model: "sellers",
            select: "fullName email phone",
          })
          .populate({
            path: "propertyId",
            model: "properties",
          })
          .skip(startIndex)
          .limit(limit);

        const bannerIds = banners.map((b) => b._id);
        const bannerClicks = await BannerClicks.aggregate([
          { $match: { bannerId: { $in: bannerIds } } },
          { $group: { _id: "$bannerId", count: { $sum: 1 } } },
        ]);

        const bannersWithClicks = banners.map((b) => {
          const clickData = bannerClicks.find(
            (click) => String(click._id) === String(b._id)
          );
          return {
            ...b._doc,
            bannerClicks: clickData ? clickData.count : 0,
          };
        });

        return res.status(200).send({
          data: bannersWithClicks,
          ...result,
          message: "Banner fetched successfully",
        });
      }
    } catch (e) {
      // fall through to non-admin flow
    }

    // Determine client IP and log current city (handles proxies and localhost)
    const getClientIp = () => {
      const cfIp = req.headers["cf-connecting-ip"];
      const realIp = req.headers["x-real-ip"];
      const xff = req.headers["x-forwarded-for"];
      const candidates = []
        .concat(xff ? String(xff).split(",") : [])
        .concat(cfIp || [])
        .concat(realIp || [])
        .concat(req.connection && req.connection.remoteAddress ? [req.connection.remoteAddress] : [])
        .concat(req.socket && req.socket.remoteAddress ? [req.socket.remoteAddress] : [])
        .concat(req.connection && req.connection.socket && req.connection.socket.remoteAddress ? [req.connection.socket.remoteAddress] : []);
      const normalized = candidates
        .map((s) => String(s).trim())
        .filter(Boolean)
        .map((s) => (s.startsWith("::ffff:") ? s.replace("::ffff:", "") : s))
        .map((s) => (s === "::1" ? "127.0.0.1" : s));
      const isPrivate = (ip) => {
        return (
          ip.startsWith("10.") ||
          ip.startsWith("192.168.") ||
          /^172\.(1[6-9]|2\d|3[0-1])\./.test(ip) ||
          ip.startsWith("127.") ||
          ip === "0.0.0.0" ||
          ip.includes(":") // treat IPv6 as non-public here for simplicity
        );
      };
      const publicIp = normalized.find((ip) => !isPrivate(ip));
      return publicIp || normalized[0] || null;
    };

    const detectedIp = getClientIp();
    // Predeclare city so we can use it in the query below
    let currentCity = "Delhi";
    let currentCityNormalized = "Delhi";
    const normalizeCity = (name) =>
      String(name || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // remove diacritics
        .replace(/[^A-Za-z\s]/g, "") // remove non-letters
        .replace(/\s+/g, " ")
        .trim();
    try {
      const ipinfoUrl = detectedIp && !detectedIp.startsWith("127.")
        ? `https://ipinfo.io/${detectedIp}?token=4f0190a299c9e7`
        : `https://ipinfo.io?token=4f0190a299c9e7`;
      const { data: ipInfo } = await axios.get(ipinfoUrl);
      currentCity = ipInfo?.city || "Delhi";
      currentCityNormalized = normalizeCity(currentCity);
      console.log("Current city by IP:", currentCityNormalized, "IP:", detectedIp || "unknown");
    } catch (ipErr) {
      console.log("Could not determine city from IP:", detectedIp || "unknown", ipErr?.message);
    }

    // Allow explicit override from client for local/dev or precise control
    const requestedCity = req.query.city || req.headers["x-client-city"];
    if (requestedCity) {
      currentCity = requestedCity;
      currentCityNormalized = normalizeCity(requestedCity);
      console.log("City overridden by client:", currentCityNormalized);
    }

    const totalCount = await Banner.countDocuments()

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

    const pagination =
      page && limit ? [{ $skip: startIndex }, { $limit: limit }] : [];

    // Fetch banners for the normalized current city only, newest first
    const banner = await Banner.find({ city: currentCityNormalized })
      .sort({ createdAt: -1 })
      .populate({
        path: "admin",
        model: "sellers",
        select: "fullName email phone",
      })
      .populate({
        path: "propertyId",
        model: "properties",
      })
      .skip(startIndex)
      .limit(limit);
    const bannerIds = banner.map((banners) => banners._id);
    const bannerClicks = await BannerClicks.aggregate([
      {
        $match: {
          bannerId: { $in: bannerIds },
        },
      },
      {
        $group: {
          _id: "$bannerId",
          count: { $sum: 1 },
        },
      },
    ]);
    const bannersWithClicks = banner.map((banners) => {
      const clickData = bannerClicks.find(
        (click) => String(click._id) === String(banners._id)
      );
      return {
        ...banners._doc,
        bannerClicks: clickData ? clickData.count : 0,
      };
    });

    // If more than one banner found for the city, return all paginated for non-admin
    return res.status(200).send({
      data: bannersWithClicks,
      currentCity,
      currentCityNormalized,
      message: "Banner fetched successfully",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ error: "Someting broke!" });
  }
};

const generateUniqueId = () => {
  return crypto.randomBytes(16).toString("hex");
};

exports.viewBanner = async (req, res) => {
  try {
    let user = null;
    let uniqueIdentifier = null;
    if (req.user) {
      user = req.user?._id;
    } else {
      uniqueIdentifier = req.cookies["uniqueUser"];
      if (!uniqueIdentifier) {
        uniqueIdentifier = generateUniqueId();
        res.cookie("uniqueUser", uniqueIdentifier, {
          maxAge: 1000 * 60 * 60 * 24 * 365,
          httpOnly: true,
        });
      }
    }

    const bannerId = req.params.bannerId;
    const banner = await Banner.findOne({ _id: bannerId });
    const carousel = await Carousel.findOne({ _id: bannerId });

    if (!banner && !carousel) {
      return res.status(400).send({ message: "Banner not found" });
    }

    const query = { bannerId: bannerId };

    if (user) {
      query.userId = user;
    } else if (uniqueIdentifier) {
      query.uniqueIdentifier = uniqueIdentifier;
    }
    const existingView = await BannerClicks.findOne(query).sort({
      createdAt: -1,
    });
    if (existingView) {
      const lastViewTime = new Date(existingView.createdAt);
      const currentTime = new Date();
      const timeDifference = (currentTime - lastViewTime) / (1000 * 60 * 60);

      if (timeDifference < 24) {
        return res
          .status(200)
          .send({ message: "Banner fetched successfully (within 24 hours)" });
      }
    }
    await BannerClicks.create({
      bannerId: bannerId,
      userId: user || null,
      uniqueIdentifier: uniqueIdentifier || null,
    });
    return res.status(200).send({ message: "Banner fetched successfully" });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ error: "Something broke!" });
  }
};

exports.deleteBanner = async (req, res) => {
  try {
    const bannerId = req.params.bannerId;
    const Banners = await Banner.findById(bannerId);
    if (!Banners) {
      return res.status(404).send({ message: "Banner not found" });
    }
    const bannerData = await Banner.deleteOne();
    return res
      .status(200)
      .send({ banner: bannerData, message: "Banner deleted successfully" });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ error: "Someting broke!" });
  }
};

exports.getTopBanners = async (req, res) => {
  try {
    const propertyType = req.query.propertyType;
    const Banners = await Banner.find({
      propertyType: propertyType,
      bannerType: "List Page",
      type: "top",
      status: true,
    })
    .populate({
      path: "propertyId",
      model: "properties",
    })
    return res
      .status(200)
      .send({ data: Banners, message: "Banner fetched successfully" });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ error: "Someting broke!" });
  }
};

exports.geDetailPageBanners = async (req, res) => {
  try {
    const forwardedFor = req.headers["x-forwarded-for"];
    const ip = forwardedFor
      ? forwardedFor.split(",")[0]
      : req.connection.remoteAddress;

    // const ip = "223.181.23.181";

    const { data: ipInfo } = await axios.get(
      `https://ipinfo.io/${ip}?token=4f0190a299c9e7`
    );
    const currentCity = ipInfo?.city || "Delhi";
    const Banners = await Banner.find({
      bannerType: {$in : ["Detail Page - Property", "Detail Page - Banner Only"]},
      city: currentCity,
      type: "top",
      status: true,
    })
    .populate({
      path: "propertyId",
      model: "properties",
    })
    return res
      .status(200)
      .send({ data: Banners, message: "Banner fetched successfully" });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ error: "Someting broke!" });
  }
};

exports.getMidBanners = async (req, res) => {
  try {
    const forwardedFor = req.headers["x-forwarded-for"];
    const ip = forwardedFor
      ? forwardedFor.split(",")[0]
      : req.connection.remoteAddress;

    const { data: ipInfo } = await axios.get(
      `https://ipinfo.io/${ip}?token=4f0190a299c9e7`
    );
    const currentCity = ipInfo?.city || "Delhi";
    const Banners = await Property.find({
      prmotionType: "Add On",
      promotionCity: currentCity,
    }).populate({
      path: "postedBy",
      model: "sellers",
      select: "fullName email phone",
    })
    .populate({
      path: "propertyId",
      model: "properties",
    })
    return res
      .status(200)
      .send({ data: Banners, message: "Banner fetched successfully" });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ error: "Someting broke!" });
  }
};

exports.radiusProperties = async (req, res) => {
  try {
    const forwardedFor = req.headers["x-forwarded-for"];
    const ip = forwardedFor ? forwardedFor.split(",")[0] : req.connection.remoteAddress;

    const { data: ipInfo } = await axios.get(
      `https://ipinfo.io/${ip}?token=4f0190a299c9e7`
    );
    const currentCity = ipInfo?.city || "Delhi";

    const cityData = await City.findOne({ name: currentCity });
    if (!cityData) {
      return res.status(404).send({ error: "City not found in the database." });
    }

    const latitude = parseFloat(cityData.latitude);
    const longitude = parseFloat(cityData.longitude);

    if (!latitude || !longitude) {
      return res.status(400).send({ error: "Could not determine the location." });
    }

    //cities within a 100 km radius with their latitude and longitude
    const nearbyCities = await City.find().then((cities) =>
      cities
        .map((city) => ({
          name: city.name,
          latitude: parseFloat(city.latitude),
          longitude: parseFloat(city.longitude),
        }))
        .filter((city) => {
          const distance = geolib.getDistance(
            { latitude, longitude },
            { latitude: city.latitude, longitude: city.longitude }
          );
          return geolib.convertDistance(distance, "km") <= 100;
        })
    );

    //properties in nearby cities
    const cityNames = nearbyCities.map((city) => city.name);
    const Banners = await Property.find({
      city: { $in: cityNames },
    }).populate({
      path: "postedBy",
      model: "sellers",
      select: "fullName email phone",
    });

    return res.status(200).send({
      data: Banners,
      location: { city: currentCity, latitude, longitude },
      nearbyCities,
      message: "Properties fetched successfully within 100 km radius",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ error: "Something went wrong!" });
  }
};
