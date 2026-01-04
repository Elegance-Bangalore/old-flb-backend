const Tags = require("../model/blogTags");
const Category = require("../model/category");
const Seller = require("../model/seller.model");
const SubCategory = require("../model/blogSubCategory");

exports.Category = async (req, res) => {
  try {
    const adminId = req.user?._id;
    const { category, description } = req.body;
    if (!category)
      return res.status(400).send({ error: "Category is required" });
    const data = {
      category: category,
      description: description,
      admin: adminId,
    };
   const categories =  await Category.create(data);
    return res
      .status(201)
      .send({ data : categories, success: "Category created Successfully" });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ error: "Something broke" });
  }
};

exports.getCategoryList = async (req, res) => {
  try {
    // const adminId = req.user._id;
    // if (!adminId) return res.status(400).send({ error: "Admin not found" });
    let page = parseInt(req.query.page);
    let limit = parseInt(req.query.limit);
    let startIndex = (page - 1) * limit;
    let endIndex = page * limit;

    let result = {};

    const totalCount = await Category.countDocuments().exec();

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

    const query = req.query.query || "";

    let searchQuery = query
      ? {
          $or: [
            {
              description: { $regex: new RegExp(`^${query}`), $options: "si" },
            },
            { category: { $regex: new RegExp(`^${query}`), $options: "si" } },
          ],
        }
      : {};

    const data = await Category.find(searchQuery)
      .populate("admin")
      .skip(startIndex)
      .limit(limit);
    return res.status(200).send({ data, count: totalCount });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ error: "Something broke" });
  }
};

exports.updateCategories = async (req, res) => {
  try {
    const adminId = req.user._id;
    // if (!adminId) return res.status(400).send({ error: "Admin not found" });
    const { categoryId } = req.params;
    if (!categoryId)
      return res.status(400).send({ error: "Category Id is required" });
    const categories = await Category.findOne({ _id: categoryId });
    if (!categories)
      return res.status(400).send({ error: "Category not found" });
    const { category, description } = req.body;
    if (category) {
      categories.category = category;
    }
    if (description) {
      categories.description = description;
    }
    categories.admin = adminId;
    await categories.save();
    return res
      .status(200)
      .send({ categories, success: "Category updated successfully" });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ error: "Something broke" });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const adminId = req.user._id;
    // if (!adminId) return res.status(400).send({ error: "Admin not found" });
    const { categoryId } = req.params;
    if (!categoryId)
      return res.status(400).send({ error: "Category Id is required" });
    const categories = await Category.findOne({ _id: categoryId });
    if (!categories)
      return res.status(400).send({ error: "Category not found" });
    const data = await Category.findByIdAndDelete({ _id: categoryId });
    return res.status(200).send({ success: "Category deleted Successfully" });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ error: "Something Broke" });
  }
};

exports.addTags = async (req, res) => {
  try {
    const adminId = req.user._id;
    const { tags } = req.body;
    if (!tags) return res.status(400).send({ error: "Tags is required" });
    const data = {
      tags: tags,
      admin: adminId,
    };
    const tagsdata = await Tags.create(data);
    return res
      .status(201)
      .send({ data: tagsdata, success: "Tags Added" });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ error: "Something broke" });
  }
};

exports.editTags = async (req, res) => {
  try {
    const adminId = req.user._id;
    const { tagId } = req.params;
    if (!tagId) return res.status(400).send({ error: "Tag Id is required" });
    const tag = await Tags.findOne({ _id: tagId });
    if (!tag) return res.status(400).send({ error: "Tag not found" });
    const { tags } = req.body;
   if(tags) {
      tag.tags = tags
    }
    const data = {
      tags: tags,
      admin: adminId,
    };
    
    const tagsdata = await Tags.findByIdAndUpdate({ _id: tagId }, data, {
      new: true,
    });
    return res
      .status(201)
      .send({ data: tagsdata, success: "Tags Updated" });
  } catch (error) { 
    console.log(error);
    return res.status(500).send({ error: "Something broke" });
  }
}

exports.getTagsList = async (req, res) => {
  try {
    const adminId = req.user._id;
    // if (!adminId) return res.status(400).send({ error: "Admin not found" });
    let page = parseInt(req.query.page);
    let limit = parseInt(req.query.limit);
    let startIndex = (page - 1) * limit;
    let endIndex = page * limit;

    let result = {};

    const totalCount = await Tags.countDocuments().exec();

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

    const data = await Tags.find()
      .populate("admin")
      .skip(startIndex)
      .limit(limit);
    return res.status(200).send({ data, count: totalCount });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ error: "Something broke" });
  }
};

exports.deleteTags = async (req, res) => {
  try {
    const adminId = req.user._id;
    const { tagId } = req.params;
    if (!tagId) return res.status(400).send({ error: "Tag Id is required" });
    const tag = await Tags.findOne({ _id: tagId });
    const data = await Tags.findByIdAndDelete({ _id: tagId });
    return res.status(200).send({ success: "Tag deleted Successfully" });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ error: "Something broke" });
  }
}

//Blogs Sub Categories
exports.subCategory = async (req, res) => {
  try {
    const adminId = req.user?._id;
    const { subCategory, description } = req.body;
    if (!subCategory)
      return res.status(400).send({ error: "SubCategory is required" });
    const data = {
      subCategory: subCategory,
      description: description,
      admin: adminId,
    };
   const categories =  await SubCategory.create(data);
    return res
      .status(201)
      .send({ data : categories, success: "Category created Successfully" });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ error: "Something broke" });
  }
};

exports.getSubCategoryList = async (req, res) => {
  try {
    const adminId = req.user._id;
    let page = parseInt(req.query.page);
    let limit = parseInt(req.query.limit);
    let startIndex = (page - 1) * limit;
    let endIndex = page * limit;

    let result = {};

    const totalCount = await SubCategory.countDocuments().exec();

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

    const query = req.query.query || "";

    let searchQuery = query
      ? {
          $or: [
            {
              description: { $regex: new RegExp(`^${query}`), $options: "si" },
            },
            { subCategory: { $regex: new RegExp(`^${query}`), $options: "si" } },
          ],
        }
      : {};

    const data = await SubCategory.find(searchQuery)
      .populate("admin")
      .skip(startIndex)
      .limit(limit);
    return res.status(200).send({ data, count: totalCount });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ error: "Something broke" });
  }
};

exports.updateSubCategories = async (req, res) => {
  try {
    const adminId = req.user._id;
    const { categoryId } = req.params;
    if (!categoryId)
      return res.status(400).send({ error: "Category Id is required" });
    const categories = await SubCategory.findOne({ _id: categoryId });
    if (!categories)
      return res.status(400).send({ error: "Category not found" });
    const { subCategory, description } = req.body;
    if (subCategory) {
      categories.subCategory = subCategory;
    }
    if (description) {
      categories.description = description;
    }
    categories.admin = adminId;
    await categories.save();
    return res
      .status(200)
      .send({ categories, success: "Category updated successfully" });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ error: "Something broke" });
  }
};

exports.deleteSubCategory = async (req, res) => {
  try {
    const adminId = req.user._id;
    const { categoryId } = req.params;
    if (!categoryId)
      return res.status(400).send({ error: "Category Id is required" });
    const categories = await SubCategory.findOne({ _id: categoryId });
    if (!categories)
      return res.status(400).send({ error: "Category not found" });
    const data = await SubCategory.findByIdAndDelete({ _id: categoryId });
    return res.status(200).send({ success: "Category deleted Successfully" });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ error: "Something Broke" });
  }
};