const AboutUs = require("../model/aboutUs");
const Seller = require("../model/seller.model");
const { uploadImage, uploadVideo } = require("../utils/conrollerUtils");
const {
  idNotFoundError,
  validateId,
  validateFields,
  validateFound,
} = require("../utils/commonValidations");

exports.addAboutUs = async (req, res) => {
  try {
      const adminId = req.user?._id;
      const { title, subtitle, heroImage, mission, logo, content } = req.body;
      if (!title || !subtitle || !heroImage || !logo || !content) return validateFields(res);
      let logoUrl;
      // Upload logo image
      if (logo) {
          const logoResult = await uploadImage(logo);
          logoUrl = logoResult.Location;
      }

      let heroImageUrl;
      if (heroImage) {
          const heroImageResult = await uploadImage(heroImage);
          heroImageUrl = heroImageResult.Location;
      }

      let missionData = [];
      if (mission && Array.isArray(mission)) {
          missionData = await Promise.all(mission.map(async (item) => {
              let iconUrl;
              if (item.icon) {
                  const iconResult = await uploadImage(item.icon);
                  iconUrl = iconResult.Location;
              }
              return {
                  icon: iconUrl,
                  heading: item.heading,
                  description: item.description,
              };
          }));
      }

      const data = {
          admin: adminId,
          heroImage: heroImageUrl,
          title: title,
          subtitle: subtitle,
          mission: missionData, 
          logo: logoUrl,
          content,
      };
      const about = await AboutUs.create(data);
      return res
          .status(201)
          .send({ about, success: "About Us has been created" });
  } catch (err) {
      console.log(err);
      return res.status(500).send({ error: "Something broke" });
  }
};

exports.editAboutUs = async (req, res) => {
  try {
      const adminId = req.user?._id;
      const { aboutId } = req.params;
      const { title, subtitle, heroImage, mission, logo, content } = req.body;
      let reg = new RegExp("^(http|https)://", "i");

      // Fetch the existing About Us data
      let about = await AboutUs.findById(aboutId);
      if (!about) {
          return res.status(404).send({ error: "About Us not found" });
      }

      // Upload logo image if provided
      let logoUrl = about.logo;
      if (logo) {
        if(!reg.test(logo)) {
          const logoResult = await uploadImage(logo);
          logoUrl = logoResult.Location;
        }
      }

      // Upload hero image if provided
      let heroImageUrl = about.heroImage;
      if (heroImage) {
        if(!reg.test(heroImage)) {
          const heroImageResult = await uploadImage(heroImage);
          heroImageUrl = heroImageResult.Location;
      }
    }

      // Update mission array if provided
      let updatedMission = about.mission;
      if (mission !== undefined && Array.isArray(mission)) {
          updatedMission = await Promise.all(mission.map(async (item, index) => {
              let iconUrl = about.mission[index]?.icon || '';
              if (item.icon) {
                if(!reg.test(item.icon)) {
                  const iconResult = await uploadImage(item.icon);
                  iconUrl = iconResult.Location;
              }
            }
              return {
                  icon: iconUrl,
                  heading: item.heading || '',
                  description: item.description || '',
              };
          }));
      }

      // Update About Us data
      about.admin = adminId;
      about.title = title || about.title;
      about.subtitle = subtitle || about.subtitle;
      about.heroImage = heroImageUrl;
      about.mission = updatedMission;
      about.logo = logoUrl;
      about.content = content || about.content;

      // Save the updated About Us data
      await about.save();

      return res.status(200).send({ about, success: "About Us has been updated" });
  } catch (err) {
      console.error(err);
      return res.status(500).send({ error: "Something broke" });
  }
};
  
exports.getAboutUs = async (req, res) => {
  try {
      let about = await AboutUs.find();
      
      // If no data available, return structure with empty strings
      // if (about.length === 0) {
      //     about = [{
      //         title: "",
      //         subtitle: "",
      //         heroImage: "",
      //         mission: [{ icon: "", heading: "", description: "" }],
      //         logo: "",
      //         content: ""
      //     }];
      // }
      
      return res.status(200).send({ about, success: "About Us details fetched successfully" });
  } catch (error) {
      console.log(error);
      return res.status(500).send({ error: "Something broke" });
  }
};