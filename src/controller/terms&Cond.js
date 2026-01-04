const TermsCondition = require("../model/terms&Cond");

exports.addTermsCondition = async (req, res) => {
  try {
    const { termsCondition } = req.body;
    const admin = req.user._id;
    const newTermsCondition = new TermsCondition({
      termsCondition,
      admin,
    });
    await newTermsCondition.save();
    res.status(201).json(newTermsCondition);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Something went wrong" });
  }
};

exports.updateTermsCondition = async (req, res) => {
  try {
    const termsId = req.params.termsId;
    const terms = await TermsCondition.findById(termsId);
    if (!terms) return res.status(40).json({ error: "Terms not found" });
    const { termsCondition } = req.body;
    if (termsCondition) terms.termsCondition = termsCondition;
    await terms.save();
    res.status(200).json({ terms, message: "Terms updated successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Something went wrong" });
  }
};

exports.getTermsCondition = async (req, res) => {
  try {
    const page = parseInt(req.query.page);
    const limit = parseInt(req.query.limit);
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const terms = await TermsCondition.find()
      .skip(startIndex)
      .limit(limit)
      .sort({ createdAt: -1 });
    const totalTerms = await TermsCondition.countDocuments().exec();
    res
      .status(200)
      .json({
        terms,
        totalCount: totalTerms,
        message: "Terms fetched successfully",
      });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Something went wrong" });
  }
};
