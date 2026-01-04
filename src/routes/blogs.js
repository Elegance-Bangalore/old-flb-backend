const router = require("express").Router();
const { verifyJwtToken } = require("../utils/token.utils");
const multer = require("multer");
const upload = multer();

const {
  createBlogs,
  getblogLists,
  updateBlogs,
  deleteBlogs,
  getblogsById,
  uploadImage,
  uploadVideo,
  getCategoryBlogs,
  subCategoryBlogs,
  getAllCategories,
} = require("../controller/blogs");

router.post("/create/:categoryId", verifyJwtToken, createBlogs);
router.get("/get", verifyJwtToken, getblogLists);
router.put("/update/:blogsId", verifyJwtToken, updateBlogs);
router.delete("/remove/:blogsId", verifyJwtToken, deleteBlogs);
router.get("/get/:blogsId", verifyJwtToken, getblogsById);

//get category blogs
router.get("/categoryBlogs", getCategoryBlogs);

router.get("/subCategoryBlogs/:subCategory", subCategoryBlogs);

//upload image
router.post("/upload/image", upload.single("image"), uploadImage);
router.post("/upload/video", upload.single("video"), uploadVideo);
// router.get("/categories", getAllCategories);

router.get("/categories", getAllCategories);

// router.get("/subcategories", getAllSubCategories);

module.exports = router;
