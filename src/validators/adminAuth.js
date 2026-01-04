const Seller = require("../model/seller.model");

exports.checkAdmin = async (req, res) => {
  const adminId = req.user?._id;
  if (!adminId) return { isAdmin: false, error: "Admin not found" };

  try {
    const user = await Seller.findOne({ _id: adminId });
    if (!user) return { isAdmin: false, error: "Admin does not exist" };

    if (user.interested !== "admin") {
      return { isAdmin: false, error: "You are not allowed" };
    }

    return { isAdmin: true, adminId, error: null };
  } catch (error) {
    console.error("Error in admin check:", error);
    return { isAdmin: false, error: "Internal Server Error" };
  }
};
