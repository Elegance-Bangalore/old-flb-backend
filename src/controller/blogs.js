const Blogs = require("../model/blogs");
const Seller = require("../model/seller.model");
const Category = require("../model/category");
const { uploadImage, uploadVideo } = require("../utils/conrollerUtils");
const Tags = require("../model/blogTags");
const SubCategory = require("../model/blogSubCategory");
const { default: mongoose } = require("mongoose");

exports.createBlogs = async (req, res) => {
  try {
    const adminId = req.user?._id;
    const { categoryId } = req.params;
    if (!categoryId)
      return res.status(400).send({ error: "Category is required" });
    const categories = await Category.findOne({ _id: categoryId });
    if (!categories)
      return res.status(400).send({ error: "Category not found" });
    const {
      mainCategory,
      title,
      selectDate,
      tags,
      featured,
      content,
      logo,
      status,
      meta,
      slug,
      subCategory,
      youtubeLink,
    } = req.body;
    if (!title) return res.status(400).send({ error: "title is required" });
    if (!selectDate) return res.status(400).send({ error: "Date is required" });
    if (!tags) return res.status(400).send({ error: "Tags is required" });

    if (
      !Array.isArray(tags) ||
      !tags.every((tag) => mongoose.Types.ObjectId.isValid(tag))
    ) {
      return res.status(400).send({ error: "Tags is not valid" });
    }

    const subCategories = await SubCategory.findOne({ _id: subCategory });

    const data = {
      mainCategory: mainCategory,
      title: title,
      selectDate: selectDate,
      tags: tags,
      featured: featured,
      content: content,
      categoryId: categoryId,
      admin: adminId,
      status: status,
      meta: meta,
      slug: slug,
      youtubeLink: youtubeLink,
    };

    if (subCategory) {
      data.subCategory = subCategory;
    }

    if (logo) {
      const s3Image = await uploadImage(logo);
      data.logo = s3Image.Location;
    }
    const blog = await Blogs.create(data);
    categories.associatedBlogs += 1;
    await categories.save();
    // subCategories.associatedBlogs += 1;
    // await subCategories.save();
    return res.status(201).send({ success: "Blog posted successfuly", blog });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ error: "Something broke" });
  }
};

exports.getblogLists = async (req, res) => {
  try {
    const adminId = req.user?._id;
    // if (!adminId) return res.status(400).send({ error: "Admin not found" });
    const page = parseInt(req.query.page);
    const limit = parseInt(req.query.limit);
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;

    let result = {};

    if (endIndex < (await Blogs.countDocuments().exec())) {
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

    const order = req.query.order || "";
    const sort = req.query.sort || "";

    let sortOrder = {};
    if (order === "ascending") {
      sortOrder = { [sort]: 1 };
    } else if (order === "descending") {
      sortOrder = { [sort]: -1 };
    } else {
      sortOrder = { createdAt: -1 };
    }

    const query = req.query.searchByName || "";
    console.log("User searched:", query);
    const category = req.query.category || "";

    const searchQuery = query
      ? { title: { $regex: '^' + query, $options: 'i' } }
      : {};

      let categoryFilter = {};
    if (category) {
      const categories = await Category.find({
        category: category,
      }).select("_id");

      const categoryIds = categories.map((cat) => cat._id);

      if (categoryIds.length > 0) {
        categoryFilter = { categoryId: { $in: categoryIds } };
      }
    }
    const totalCount = await Blogs.find({ ...searchQuery, ...categoryFilter })
      .countDocuments()
      .exec();

    const data = await Blogs.find({ ...searchQuery, ...categoryFilter })
      .populate({
        path: "categoryId",
        model: "category",
      })
      .populate({
        path: "tags",
        model: "tags",
      })
      .populate({
        path: "subCategory",
        model: "subcategory",
      })
      .populate({
        path: "admin",
        model: "sellers",
      })
      .sort(sortOrder)
      .skip(startIndex)
      .limit(limit);

    console.log("Blogs found (titles):");
    data.forEach(blog => console.log(blog.title));

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

exports.updateBlogs = async (req, res) => {
  try {
    const adminId = req.user?._id;
    const { blogsId } = req.params;
    if (!blogsId) return res.status(400).send({ error: "Something broke" });

    const blog = await Blogs.findById(blogsId);
    if (!blog) return res.status(404).send({ error: "Blog not found" });

    const {
      mainCategory,
      categoryId,
      title,
      selectDate,
      tags,
      featured,
      content,
      logo,
      status,
      meta,
      slug,
      subCategory,
      youtubeLink,
    } = req.body;

    if (categoryId) {
      const categoryExists = await Category.findById(categoryId);
      if (!categoryExists) {
        return res.status(400).send({ error: "Category not found" });
      }
      blog.categoryId = categoryId;
    }

    if (tags) {
      if (
        !Array.isArray(tags) ||
        !tags.every((tag) => mongoose.Types.ObjectId.isValid(tag))
      ) {
        return res.status(400).send({ error: "Tags is not valid" });
      }
    }

    if (mainCategory) blog.mainCategory = mainCategory;
    if (title) blog.title = title;
    if (selectDate) blog.selectDate = selectDate;
    if (tags) blog.tags = tags;
    if (featured) blog.featured = featured;
    if (content) blog.content = content;
    if (status) blog.status = status;
    if (meta) blog.meta = meta;
    if (slug) blog.slug = slug;
    if (subCategory) blog.subCategory = subCategory;
    if (youtubeLink) blog.youtubeLink = youtubeLink;
    if (adminId) blog.admin = adminId;

    let reg = new RegExp("^(http|https)://", "i");
    let result;

    if (logo) {
      if (!reg.test(logo)) {
        const logoResult = await uploadImage(logo);
        result = logoResult.Location;
      }
    }

    if (result) {
      blog.logo = result;
    }

    await blog.save();
    return res.status(200).send({ success: "Blog updated successfully", blog });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ error: "Something broke" });
  }
};

exports.deleteBlogs = async (req, res) => {
  try {
    const adminId = req.user?._id;
    const { blogsId } = req.params;
    if (!blogsId) return res.status(400).send({ error: "Blog not found" });

    const deletedBlog = await Blogs.findByIdAndDelete(blogsId);
    const category = await Category.findById(deletedBlog.categoryId);
    if (!category) return res.status(404).send({ error: "Category not found" });
    category.associatedBlogs -= 1;
    await category.save();
    const Categories = await SubCategory.findById(deletedBlog.subCategory);
    Categories.associatedBlogs -= 1;
    await Categories.save();
    return res.status(200).send({ success: "Blog removed successfully" });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ error: "Something broke" });
  }
};

exports.getblogsById = async (req, res) => {
  try {
    const adminId = req.user?._id;
    const { blogsId } = req.params;
    if (!blogsId) return res.status(400).send({ error: "Blog not found" });
    const data = await Blogs.findById(blogsId)
      .populate({
        path: "categoryId",
        model: "category",
      })
      .populate({
        path: "tags",
        model: "tags",
      })
      .populate({
        path: "subCategory",
        model: "subcategory",
      })
      .populate({
        path: "admin",
        model: "sellers",
      });
    return res.status(200).send({ blog: data });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ error: "Something broke" });
  }
};

exports.getCategoryBlogs = async (req, res) => {
  try {
    const categories = await Category.find({});
    const result = [];
    let categoriesWithBlogsCount = 0;
    for (const category of categories) {
      const blogs = await Blogs.find({ categoryId: category._id }).sort({
        createdAt: -1,
      });

      if (blogs.length > 0) {
        result.push({
          _id: category._id,
          category: category.category,
          description: category.description,
          blogCount: blogs.length,
          blogs: blogs,
        });
        categoriesWithBlogsCount++;
      }
    }
    res
      .status(200)
      .send({ categories: result, totalCount: categoriesWithBlogsCount });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ error: "Something broke" });
  }
};

exports.subCategoryBlogs = async (req, res) => {
  try {
    const page = parseInt(req.query.page);
    const limit = parseInt(req.query.limit);
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const adminId = req.user?._id;
    const { subCategory } = req.params;
    if (!subCategory)
      return res.status(400).send({ error: "Sub Category required" });
    const subCategoryData = await SubCategory.findById(subCategory);
    if (!subCategoryData)
      return res.status(400).send({ error: "Sub Category not found" });
    const data = await Blogs.find({ subCategory: subCategory })
      .populate({
        path: "categoryId",
        model: "category",
      })
      .populate({
        path: "tags",
        model: "tags",
      })
      .populate({
        path: "subCategory",
        model: "subcategory",
      })
      .populate({
        path: "admin",
        model: "sellers",
      })
      .skip(startIndex)
      .limit(limit)
      .sort({ createdAt: -1 });
    const count = data.length;
    return res.status(200).send({ blog: data, totalCount: count });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ error: "Something broke" });
  }
};

// aws Config
const AWS = require("aws-sdk");
const { Console, count } = require("console");

const awsConfig = {
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
  apiVersion: process.env.AWS_API_VERSION,
};
const S3 = new AWS.S3(awsConfig);

exports.uploadImage = async function (req, res) {
  console.log('...............upoad image')
  try {
    const image = req.file;
    if (!image) {
      return res.status(400).send("No image found");
    }
    const fileName = image.originalname.replace(/\s/g, "");
    const params = {
      Bucket: "flb-public",
      Key: `${fileName}`,
      Body: image.buffer,
      //ACL: "public-read",
      ContentType: image.mimetype,
    };
    const data = await S3.upload(params).promise();
    res
      .status(200)
      .json({ successMessage: "Image uploaded successfully", data });
  } catch (err) {
    console.error(err);
    return res.status(500).send("Failed to upload image");
  }
};

exports.uploadVideo = async function (req, res) {
  try {
    const video = req.file;
    if (!video) {
      return res.status(400).send("No video found");
    }
    const fileName = video.originalname.replace(/\s/g, "");
    const params = {
      Bucket: "flb-public",
      Key: `${fileName}`,
      Body: video.buffer,
      //ACL: "public-read",
      ContentType: video.mimetype,
    };
    const data = await S3.upload(params).promise();
    res
      .status(200)
      .json({ successMessage: "Video uploaded successfully", data });
  } catch (err) {
    console.error(err);
    return res.status(500).send("Failed to upload video");
  }
};

exports.getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find({}, { _id: 1, category: 1 });
    res.status(200).json({ data: categories });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Something broke' });
  }
};

// exports.getAllSubCategories = async (req, res) => {
//   try {
//     const subcategories = await SubCategory.find({});
//     return res.status(200).send({ data: subcategories });
//   } catch (error) {
//     return res.status(500).send({ error: "Something broke" });
//   }
// };

