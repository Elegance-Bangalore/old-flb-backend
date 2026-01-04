const Faq = require("../model/faqs");
const { checkAdmin } = require("../validators/adminAuth");

exports.createFaqs = async (req, res) => {
  try {
    let adminId = req.user?._id
    // const { isAdmin, adminId, error } = await checkAdmin(req, res);
    // if (!isAdmin) {
    //   return res.status(400).send({ error });
    // }
    const { category, question, answers } = req.body;
    if (!category)
      return res.status(400).send({ error: "Category is required" });
    if (!question)
      return res.status(400).send({ error: "Question is required" });
    if (!answers) return res.status(400).send({ error: "Answers is required" });
    const data = {
      category,
      question,
      answers,
      admin: adminId,
    };
    const faq = await Faq.create(data);
    return res.status(201).send({ faq, success: "Added successfully" });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ error: "Something broke" });
  }
};

exports.getFaqsLists = async (req, res) => {
  try {
    const { isAdmin, adminId, error } = await checkAdmin(req, res);
    // if (!isAdmin) {
    //   return res.status(400).send({ error });
    // }
    const page = parseInt(req.query.page);
    const limit = parseInt(req.query.limit);
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;

    let result = {};

    if (endIndex < (await Faq.countDocuments().exec())) {
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

    const query = req.query.query || "";
    const category = req.query.category || "";

    const searchQuery = {
      ...(query
        ? {
            $or: [
              { question: { $regex: new RegExp(`${query}`, "i") } },
              { answers: { $regex: new RegExp(`${query}`, "i") } },
            ],
          }
        : {}),
      ...(category ? { category: category } : {}),
    };

    const totalCount = await Faq.find(searchQuery).countDocuments().exec();

    const data = await Faq.find(searchQuery)
      .populate({
        path: "admin",
        model: "sellers",
      })
      .skip(startIndex)
      .limit(limit);

    res.json({
      resStatus: true,
      res: data,
      count: totalCount,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ error: "Something broke" });
  }
};

exports.updateFaqs = async (req, res) => {
  try {
    let adminId = req.user?._id
    // const { isAdmin, adminId, error } = await checkAdmin(req, res);
    // if (!isAdmin) {
    //   return res.status(400).send({ error });
    // }
    const { faqId } = req.params;
    if (!faqId) return res.status(400).send({ error: "Faq Id is required" });
    const faq = await Faq.findOne({ _id: faqId });
    if (!faq) return res.status(400).send({ error: "Faq not found" });
    const { category, question, answers } = req.body;
    if (category) {
      faq.category = category;
    }
    if (question) {
      faq.question = question;
    }
    if (answers) {
      faq.answers = answers;
    }
    faq.admin = adminId;
    await faq.save();
    return res.status(200).send({ faq, success: "Updated successfully" });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ error: "Something broke" });
  }
};

exports.deleteFaqs = async (req, res) => {
  try {
    //const { isAdmin, adminId, error } = await checkAdmin(req, res);
    // if (!isAdmin) {
    //   return res.status(400).send({ error });
    // }
    const { faqId } = req.params;
    if (!faqId) return res.status(400).send({ error: "Faq Id is required" });
    const faq = await Faq.findOne({ _id: faqId });
    if (!faq) return res.status(400).send({ error: "Faq not found" });
    const data = await Faq.findByIdAndDelete({ _id: faqId });
    return res.status(200).send({ data, success: "Deleted Successfully" });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ error: "Something Broke" });
  }
};
