const { log } = require("util");
const contactUs = require("../model/contactUs");
const {
  idNotFoundError,
  validateId,
  validateFields,
  validateFound,
} = require("../utils/commonValidations");

exports.addContactUs = async (req, res) => {
  try {
    const adminId = req.user._id;
    const { title, subtitle, email, number, alternateNumber, address, link } =
      req.body;
    if (!title || !subtitle || !email || !number || !address || !link)
      return validateFields(res);
    const data = {
      admin: adminId,
      title,
      subtitle,
      email,
      number,
      alternateNumber,
      address,
      link,
    };
    const contactus = await contactUs.create(data);
    return res
      .status(201)
      .send({ contactus, success: "Contact Us has been created" });
  } catch (err) {
    console.log(err);
    return res.status(500).send({ error: "Something broke" });
  }
};

exports.editContactUs = async (req, res) => {
  try {
    const adminId = req.user._id;
    const { title, subtitle, email, number, alternateNumber, address, link } =
      req.body;
    const { contactId } = req.params;
    if (!contactId) return validateId(res);
    const contact = await contactUs.findOne({ _id: contactId });
    if (!contact) return validateFound(res);
    if (title) {
      contact.title = title;
    }
    if (subtitle) {
      contact.subtitle = subtitle;
    }
    if (email) {
      contact.email = email;
    }
    if (number) {
      contact.number = number;
    }
    if (alternateNumber !== undefined) {
      contact.alternateNumber = alternateNumber;
    }
    if (address) {
      contact.address = address;
    }
    if (link) {
      contact.link = link;
    }
    contact.admin = adminId;

    await contact.save();
    return res
      .status(200)
      .send({ contact, success: "Contact Us has been updated" });
  } catch (err) {
    console.log(err);
    return res.status(500).send({ error: "Something broke" });
  }
};

exports.getContactUs = async (req, res) => {
  try {
    const contact = await contactUs.find();
    return res.status(200).send({ contact, success: "Successfully fetched" });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ error: "Something broke" });
  }
};

exports.getContactUsById = async (req, res) => {
  try {
    const { contactId } = req.params;
    if (!contactId) return validateId(res);
    const contact = await contactUs.findById(contactId);
    if (!contact) return validateFound(res);
    return res.status(200).send({ contact, success: "Successfully fetched" });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ error: "Something broke" });
  }
}
