const express = require("express");
const {app, server} = require("./src/socket.io/socket");
// const app = express();
const os = require("os");
const cluster = require("cluster");
const clusterWorkerSize = os.cpus().length;
const cors = require("cors");
const connectDB = require("./src/config/db");
const cookieParser = require('cookie-parser');
const { runCouponExpiryCron } = require('./src/utils/cron.coupons');

// Add cookie-parser middleware
app.use(cookieParser());

// configuring env file
require("dotenv").config({ path: "./.env" });

// db connection
connectDB();

// handling cors
// const corsOptions = {
//   origin: "http://localhost:5173",
//   credentials: true, //access-control-allow-credentials:true
//   optionSuccessStatus: 200,
// };
app.use(cors());
app.use(express.json({ limit: "200mb" }));

const port = process.env.PORT;

// health check
app.get("/", (req, res) => {
  res.send({ status: 200, message: "Health ok !" });
});

app.get('/page-meta', (req, res) => {
  const {
    imageUrl = 'https://flb-public.s3.ap-south-1.amazonaws.com/Farmlandlogo%281%29.png',
    title = 'Farmland Bazaar',
    description = '',
    pageUrl = 'https://farmlandbazaar.com',
  } = req.query;
 
  // Respond with HTML containing dynamic Open Graph tags
  const htmlContent = `
<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<meta property="og:title" content="${title}">
<meta property="og:image" content="${imageUrl}">
<meta property="og:url" content="${pageUrl}">
<meta property="og:type" content="article">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<title>${title}</title>
</head>
<body>
<div id="root">Loading...</div>
<script>
        // Redirect to the actual React app
        window.location.href = "${pageUrl}";
</script>
</body>
</html>
  `;
 
  res.send(htmlContent);
});

// Blog-specific meta endpoint
app.get('/blog-meta', (req, res) => {
  const {
    title = 'Blog - Farmland Bazaar | Expert Agriculture Insights & Trends',
    description = 'Discover expert advice, latest trends, and insights in agriculture, farming, and land management. Stay updated with Farmland Bazaar\'s comprehensive blog.',
    imageUrl = 'https://flb-public.s3.ap-south-1.amazonaws.com/2Geqhte2sdxuKmoZqqyjg.jpeg',
    pageUrl = 'https://flbdev.evoluxar.com/blog',
    keywords = 'agriculture blog, farming insights, land management, agriculture trends, farmland advice, Farmland Bazaar blog'
  } = req.query;
 
  // Respond with HTML containing comprehensive meta tags for blog
  const htmlContent = `
<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<meta name="description" content="${description}">
<meta name="keywords" content="${keywords}">

<!-- Open Graph / Facebook -->
<meta property="og:title" content="${title}">
<meta property="og:description" content="${description}">
<meta property="og:image" content="${imageUrl}">
<meta property="og:image:secure_url" content="${imageUrl}">
<meta property="og:url" content="${pageUrl}">
<meta property="og:type" content="website">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">

<!-- Twitter -->
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:site" content="@FarmlandBazaar">
<meta name="twitter:title" content="${title}">
<meta name="twitter:description" content="${description}">
<meta name="twitter:image" content="${imageUrl}">

<title>${title}</title>
</head>
<body>
<div id="root">Loading...</div>
<script>
        // Redirect to the actual React app
        window.location.href = "${pageUrl}";
</script>
</body>
</html>
  `;
 
  res.send(htmlContent);
});

// handling api routes
app.use("/auth", require("./src/routes/auth.routes"));
app.use("/seller", require("./src/routes/seller.routes"));
app.use("/property", require("./src/routes/property.routes"));
app.use("/payment", require("./src/routes/payment.routes"));
app.use("/buyer", require("./src/routes/buyer.routes"));
app.use("/admin/category",require("./src/routes/category"))
app.use("/admin/blog",require("./src/routes/blogs"))
app.use("/admin/footer",require("./src/routes/manageFooter"))
app.use("/admin/property",require("./src/routes/admin.routes"))
app.use("/messages", require("./src/routes/message.routes"));
app.use("/admin", require("./src/routes/admin.routes"));
app.use("/home", require("./src/routes/homeList"));
app.use("/dev", require("./src/routes/developerProperties"));
app.use("/admin/faq", require("./src/routes/faq"));
app.use("/user", require("./src/routes/users.routes"));
app.use("/general", require("./src/routes/generalinquiry"));
app.use("/stateCity", require("./src/routes/stateCity.routes"));
app.use("/aboutUs", require("./src/routes/aboutUs"));
app.use("/contactUs", require("./src/routes/contactUs"));
app.use("/analytics", require("./src/routes/adminAnalytics"));
app.use("/documents", require("./src/routes/documentsType"));
app.use("/directory", require("./src/routes/sellerDirectory"));
app.use("/propertyAnalytics", require("./src/routes/propertyAnalytics"));
app.use("/developer", require("./src/routes/developerAnalytics"));
app.use("/testimonial", require("./src/routes/testimonial"));
app.use("/manage", require("./src/routes/adminManage"));
app.use("/banner", require("./src/routes/banner"));
app.use("/city", require("./src/routes/saveCity"));
app.use("/advertise", require("./src/routes/advertise"));
app.use("/terms", require("./src/routes/terms&Cond"));
app.use("/campaign", require("./src/routes/campaign.routes"));
app.use("/campaigns", require("./src/routes/campaign.routes")); // Also support plural for downloads API

/** api route to update properties created at
 */
app.use("/existingProperties", require("./src/routes/existingProperties"));

// Temporary test endpoint for coupon expiry cron
app.post('/admin/coupons/cron-test', async (req, res) => {
  await runCouponExpiryCron();
  res.send({ status: 200, message: 'Manual coupon expiry cron executed.' });
});

// Add this line with other API routes (around line 82)
app.use("/api", require("./src/routes/admin.routes"));

// server setup
if (clusterWorkerSize > 1 && 1 == 2) {
  if (cluster.isMaster) {
    for (let i = 0; i < clusterWorkerSize; i++) {
      cluster.fork();
    }
    cluster.on("exit", function (worker) {
      console.log("Worker", worker.id, " has exitted.");
    });
  } else {
    app.listen(port, () => {
      console.log(
        `Express server listening on port ${port} and worker ${process.pid}`
      );
    });
  }
} else {
  server.listen(port, () => {
    console.log(
      `Express server listening on port ${port} with the single worker ${process.pid}`
    );
  });
}

// ERROR CATCHING
process.on("uncaughtException", (err) => {
  console.error("There was an uncaught error", err);
  process.exit(1);
});
