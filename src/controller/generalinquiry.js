const genaralInquiry = require("../model/generalinquiery");
const { checkAdmin } = require("../validators/adminAuth");
const sendEmailSign = require("../utils/emailSend.js");
const {
  idNotFoundError,
  validateFields, validateFound,
} = require("../utils/commonValidations");

exports.generalInquiry = async (req, res) => {
  try {
    const { name, phone, email, message } = req.body;
    if (!name || !phone || !email || !message) {
      return validateFields(res);
    }
    const data = {
      name: name,
      phone: phone,
      email: email,
      message: message,
    };
    const inquiry = await genaralInquiry.create(data);
    if(inquiry){
      const data = {
        name : name,
        email  : email ,
        phone : phone 
      }
      await sendEmailSign("farmlandbazaar@gmail.com", data, 'generalinquiry', "General Inquiry");
    }
    return res.status(201).send({ inquiry, success: "Inquiry posted" });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ error: "Something broke" });
  }
};

exports.getGeneralInquiries = async (req, res) => {
  try {
    let page = parseInt(req.query.page) 
    let limit = parseInt(req.query.limit) 
    let startIndex = (page - 1) * limit;
    const query = req.query.query || "";
    const order = req.query.order || "";
    const sort = req.query.sort || "";

    let sortOrder = {};
    if (order === "ascending") {
      sortOrder = { [sort]: 1 };
    } else if (order === "descending") {
      sortOrder = { [sort]: -1 };
    } //else {
    //   sortOrder = { createdAt: -1 };
    // }

    let searchQuery = query
      ? {
          $or: [
            {
              name: { $regex: new RegExp(`^${query}`), $options: "si" },
            },
            {
              email: { $regex: new RegExp(`^${query}`), $options: "si" },
            },
            {
              phone: { $regex: new RegExp(`^${query}`), $options: "si" },
            },
          ]
        } : {}
    const inquiries = await genaralInquiry.find(searchQuery)
    .populate({
      path: "replyBy",
      model: "sellers",
    })
    .sort(sortOrder)
    .skip(startIndex)
    .limit(limit)
    const count = await genaralInquiry.countDocuments(searchQuery).exec()
    return res.status(200).send({inquiries, count : count, success : "Inquiries fetched Successfully"})
  } catch (error) {
    console.log(error);
    return res.status(500).send({ error: "Something broke" });
  }
};

exports.reply = async (req, res) => {
  try{
    const adminId = req.user._id
    const inquiryId = req.params.inquiryId
    if(!inquiryId) return validateId(res)
      const inquiry = await genaralInquiry.findById({_id:inquiryId})
    if(!inquiry) return validateFound(res)
    const {reply} = req.body
    if(!reply) return validateFields(res);
    inquiry.reply = reply
    inquiry.replyBy = adminId
    await inquiry.save()
    if(inquiry){
      const data = {
        Name : inquiry.name,
        reply : inquiry.reply
      }
      await sendEmailSign(inquiry.email, data, 'reply', "General Inquiry Reply");
    }
    return res.status(200).send({inquiry, success : "Reply Sucessfully"})
  }catch(error){
    console.log(error);
    return res.status(500).send({error : "Something broke"})
  }
}

exports.deleteInquiry = async (req, res) => {
  try{
    const inquiryId = req.params.inquiryId
    if(!inquiryId) return validateId(res)
      const inquiry = await genaralInquiry.findByIdAndDelete({_id:inquiryId})
    if(!inquiry) return validateFound(res)
      return res.status(200).send({inquiry, success : "Inquiry deleted"})
  }catch(error){
    console.log(error);
    return res.status(500).send({error : "Something broke"})
  }
}

