const router = require("express").Router();
const { verifyJwtToken } = require("../utils/token.utils");

const {Category, getCategoryList, updateCategories, deleteCategory, addTags, editTags, getTagsList, deleteTags, subCategory, getSubCategoryList, updateSubCategories, deleteSubCategory} = require("../controller/category")

router.post("/create",verifyJwtToken, Category)
router.get("/categoryList", getCategoryList)
router.put("/update/:categoryId",verifyJwtToken, updateCategories)
router.delete("/delete/:categoryId",verifyJwtToken, deleteCategory)

// adds tags for blogs
router.post("/createTags",verifyJwtToken, addTags)
router.put("/editTags/:tagId",verifyJwtToken, editTags)
router.delete("/deleteTags/:tagId",verifyJwtToken, deleteTags)
router.get("/getTags",verifyJwtToken, getTagsList)

//Blogs Sub Categories
router.post("/addSubCategory",verifyJwtToken, subCategory)
router.get("/subCategoryList",verifyJwtToken, getSubCategoryList)
router.put("/updateSubCategory/:categoryId",verifyJwtToken, updateSubCategories)
router.delete("/deleteSubCategory/:categoryId",verifyJwtToken, deleteSubCategory)

module.exports = router