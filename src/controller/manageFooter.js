const Footer = require("../model/manageFooter");
const Seller = require("../model/seller.model");

exports.createFooter = async (req, res) => {
  try {
    const adminId = req.user._id;
    // if (!adminId) return res.status(400).send({ error: "admin not found" });

    const { selectPage, title, link, status } = req.body;
    if (!selectPage)
      return res.status(400).send({ error: "Select page is required" });
    if (!title) return res.status(400).send({ error: "Title is required" });
    if (!link) return res.status(400).send({ error: "Link is required" });

    const footer = {
      selectPage: selectPage,
      title: title,
      link: link,
      status: status,
      admin: adminId,
    };
    const data = await Footer.create(footer);
    return res.status(201).send({ data, success: "Added successfully" });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ error: "Something broke" });
  }
};

exports.getFooterLists = async (req, res) => {
  try {
    const adminId = req.user?._id;
    // if (!adminId) return res.status(400).send({ error: "Admin not found" });
    const page = parseInt(req.query.page);
    const limit = parseInt(req.query.limit);
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;

    let result = {};

    if (endIndex < (await Footer.countDocuments().exec())) {
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

    const searchQuery = query
      ? {
          $or: [
            { title: { $regex: new RegExp(`${query}`, "i") } },
            { selectPage: { $regex: new RegExp(`${query}`, "i") } },
        ],
        }
      : {};

    const totalCount = await Footer.find({...searchQuery })
      .countDocuments()
      .exec();

    const data = await Footer.find({...searchQuery })
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

exports.updateFooter = async (req, res) => {
  try {
    const adminId = req.user._id;
    // if (!adminId) return res.status(400).send({ error: "Admin not found" });
    const { footerId } = req.params;
    if (!footerId)
      return res.status(400).send({ error: "Footer Id is required" });
    const footer = await Footer.findOne({ _id: footerId });
    if (!footer) return res.status(400).send({ error: "footer not found" });
    const { selectPage, title, link, status } = req.body;
    if (selectPage) {
      footer.selectPage = selectPage;
    }
    if (title) {
      footer.title = title;
    }
    if (link) {
      footer.link = link;
    }
    if (status) {
      footer.status = status;
    }

    footer.admin = adminId;
    await footer.save();
    return res.status(200).send({ footer, success: "Updated successfully" });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ error: "Something broke" });
  }
};

exports.deleteFooter = async (req, res) => {
  try {
    const adminId = req.user._id;
    // if (!adminId) return res.status(400).send({ error: "Admin not found" });
    const { footerId } = req.params;
    if (!footerId)
      return res.status(400).send({ error: "Footer Id is required" });
    const footer = await Footer.findOne({ _id: footerId });
    if (!footer) return res.status(400).send({ error: "Footer not found" });
    const data = await Footer.findByIdAndDelete({ _id: footerId });
    return res.status(200).send({ data, success: "Deleted Successfully" });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ error: "Something Broke" });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const userId = req.user._id;
    if (!userId) return res.status(400).send({ error: "User not found" });

    const { footerId } = req.params;
    if (!footerId)
      return res.status(400).send({ error: "Footer Id is required" });

    const footer = await Footer.findOne({ _id: footerId });
    if (!footer) return res.status(400).send({ error: "Footer not found" });

    const updatedStatus = !footer.status;

    const updatedFooter = await Footer.findOneAndUpdate(
      { _id: footerId },
      { $set: { status: updatedStatus, admin: userId } }, 
      { new: true }
    );

    return res.status(200).send({
      message: "Status updated successfully",
      footer: updatedFooter,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).send({ error: "Something broke" });
  }
};
