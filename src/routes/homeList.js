const router = require("express").Router();
const { verifyJwtToken, verifyOptionalJwtToken } = require("./../utils/token.utils");

const ctrl  = require("../controller/homeList");

router.get("/Blogs", ctrl.getblogLists)
router.get("/blogDetails/:blogsId", ctrl.getblogDetails)
router.get("/footer", ctrl.gethomeFooter)
router.get("/faqs", ctrl.gethomeFaqs)
router.get("/mostSearched", ctrl.getMostSearched)
router.get("/curatedDeals", verifyOptionalJwtToken, ctrl.getCuratedDeals)
router.get("/admincuratedDeals", verifyOptionalJwtToken, ctrl.getAdminCuratedDeals)
router.get("/categories", verifyOptionalJwtToken, ctrl.getCategoryProperties)
router.get("/allCities", ctrl.getCities);
router.get("/trendingProperties", verifyOptionalJwtToken, ctrl.getTrendingProperties)
router.get("/createslotsPropAll", verifyOptionalJwtToken, ctrl.createSlots)
router.get("/blogCategories", ctrl.getAllBlogCategories);
router.get("/blogSubCategories", ctrl.getAllBlogSubCategories);
router.get("/blogsByCategory", ctrl.getBlogsByCategory);
router.get("/blogsBySubCategory", ctrl.getBlogsBySubCategory);


//Carousel apis
router.get("/carousel", ctrl.getCarousels)
router.get("/adminCarousel", ctrl.getAdminCarousels)
router.post("/addCarousel", verifyJwtToken, ctrl.addCarousel)
router.put("/updateCarousel/:carouselId", verifyJwtToken, ctrl.updateCarousel)
router.delete("/deleteCarousel/:carouselId", verifyJwtToken, ctrl.deleteCarousel)

//location based carasousel
router.get("/locationCarousel", ctrl.getLocationCarousel)

router.get("/homepageStats", ctrl.getHomepageStats);

module.exports = router;
