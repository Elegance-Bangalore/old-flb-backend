const fs = require("fs");
const csv = require("csv-parser");
const path = require("path");
const Property = require("../model/property.model");
const Seller = require("../model/seller.model");
const sendEmailUsers = require("../utils/emailMultiple");
const cron = require("node-cron");

exports.updatePropertiesFromCSV = async (req, res) => {
  const results = [];

  //const csvFilePath = '../../properties.csv';
  // Construct the absolute path to the CSV file
  const csvFilePath = path.resolve(__dirname, "../properties.csv");
  console.log(`CSV file path: ${csvFilePath}`);

  // Log the current working directory
  console.log(`Current working directory: ${process.cwd()}`);

  //const csvFilePath = 'D:/evomart/farmland_new.csv';

  fs.createReadStream(csvFilePath)
    .pipe(csv())
    .on("data", (data) => results.push(data))
    .on("end", async () => {
      try {
        for (const row of results) {
          const { propertyTitle, createdAt } = row;
          const property = await Property.findOne({ propertyTitle });
          if (property) {
            //console.log(property);
            //console.log(createdAt);
            if (createdAt) {
              try {
                console.log("inside created at");
                property.customCreatedAt = createdAt.trim();
                await property.save();
                console.log("createdAt updated successfully");
              } catch (error) {
                console.error("Error updating createdAt:", error.message);

                return res
                  .status(500)
                  .send({ error: "Error updating createdAt" });
              }
            }

            //property.propertyTitle = "Vrindavan test";
            //await property.save();
          }
        }
        res.status(200).send({ success: "Properties updated successfully" });
      } catch (error) {
        console.error(error);
        res.status(500).send({ error: "Something went wrong" });
      }
    });
};

exports.getRecentlyAddedProperties = async (req, res) => {
  try {
    const properties = await Property.find({
      $or: [
        { createdAt: { $exists: true } },
        { customCreatedAt: { $exists: true } },
      ],
    })
      .sort({ createdAt: -1, customCreatedAt: -1 })
      .limit(10);

    res.status(200).json({ properties });
  } catch (error) {
    console.error("Error retrieving recently added properties:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const sendBuyerProperties = async () => {
  try {
    const buyers = await Seller.find({ interested: "buy" });

    for (const buyer of buyers) {
      // Filter out properties with propertyApproval = "IN_Review", isDeleted = true, and status = "draft"
      const propertyFilter = {
        city: buyer.city,
        propertyApproval: { $ne: "IN_Review" },
        isDeleted: { $ne: true },
        status: { $ne: "draft" }
      };

      const latestProperties = await Property.find(propertyFilter)
        .sort({ createdAt: -1 })
        .limit(3);

      const nearbyProperties = await Property.find(propertyFilter).limit(
        3
      );

      const latestPropertiesInfo = latestProperties.map((property) => ({
        propertyTitle: property.propertyTitle,
        city: property.city,
        propertyCode: property.propertyCode,
        propertyType: property.propertyType,
        price: property.price,
        totalAcre: property.totalAcre,
        heroImage: property.heroImage,
      }));

      const nearbyPropertiesInfo = nearbyProperties.map((property) => ({
        propertyTitle: property.propertyTitle,
        city: property.city,
        propertyCode: property.propertyCode,
        propertyType: property.propertyType,
        price: property.price,
        totalAcre: property.totalAcre,
        heroImage: property.heroImage,
      }));

      const emailData = {
        buyerName: buyer.fullName,
        buyerEmail: buyer.email,
      };

      // Include only non-empty arrays
      if (latestPropertiesInfo.length > 0) {
        emailData.latestProperties = latestPropertiesInfo;
      }
      if (nearbyPropertiesInfo.length > 0) {
        emailData.nearbyProperties = nearbyPropertiesInfo;
      }

      // Send the email only if there are properties to send
      if (emailData.latestProperties || emailData.nearbyProperties) {
        await sendEmailUsers(
          [buyer.email],
          emailData,
          "buyertNotifications",
          "Newly Launched Properties"
        );
      }
    }

    console.log("Emails sent successfully.");
  } catch (error) {
    console.error("Error in sendBuyerProperties:", error);
  }
};

// const hou = 15;
// const minut = 54;

// cron.schedule(`${minut} ${hou} * * *`, async () => {                                                                                                                                                                                                                                                                                                                                                   
//   console.log("Running cron job to send buyer properties...");
//   await sendBuyerProperties();
// });

//Comment for now ...................Anchan 
// Schedule the cron job to run on the 1st, 16th, and 31st days of the month 
// cron.schedule("59 11 1,16,31 * *", async () => {
//   console.log("Running cron job to send buyer properties...");
//   await sendBuyerProperties();
// });

// exports.citiesPropertiesTrends = async (req, res) => {
//   try {
//     let page = parseInt(req.query.page);
//     let limit = parseInt(req.query.limit);
//     let startIndex = (page - 1) * limit;
//     let endIndex = page * limit;

//     const currentYear = new Date().getFullYear();

//     let propertyTypeFilter = req.query.propertyType || "";
//     let propertyTypeQuery = {};

//     if (propertyTypeFilter) {
//       if (
//         ["agricultureLand", "coffeeEstate", "farmhouse", "farmland"].includes(
//           propertyTypeFilter
//         )
//       ) {
//         propertyTypeQuery = { propertyType: propertyTypeFilter };
//       } else {
//         return res
//           .status(400)
//           .send({ error: "Property type is not per requirements" });
//       }
//     }

//     const query = req.query.query || "";

//     let searchQuery = query
//       ? {
//           $or: [{ city: { $regex: new RegExp(query), $options: "si" } }],
//         }
//       : {};

//     const combinedQuery = {
//       ...propertyTypeQuery,
//       ...searchQuery,
//     };

//     const properties = await Property.find(combinedQuery);

//     const cityGroups = {};

//     for (const property of properties) {
//       if (property.city) {
//         const cityList = property.city
//           .split(",")
//           .map((city) => city.trim().toLowerCase());
//         const price = parseInt(property.price, 10);
//         const pricePerSqft = parseFloat(property.pricePerSqft); // New field for price per sqft
//         const createdAt = new Date(property.createdAt);

//         // Only consider properties created in the current year
//         if (createdAt.getFullYear() === currentYear) {
//           const month = createdAt.getMonth(); // Month index: 0 for January, 11 for December

//           cityList.forEach((city) => {
//             if (city) {
//               if (!cityGroups[city]) {
//                 cityGroups[city] = {
//                   properties: [],
//                   minPrice: price,
//                   maxPrice: price,
//                   totalPricePerSqft: 0, // To store total price per sqft
//                   totalProperties: 0, // To track the count of properties with pricePerSqft
//                   monthlyPrices: Array(12)
//                     .fill(0)
//                     .map(() => []),
//                 };
//               }

//               cityGroups[city].properties.push(property);

//               // Update total price per sqft and property count
//               if (pricePerSqft) {
//                 cityGroups[city].totalPricePerSqft += pricePerSqft;
//                 cityGroups[city].totalProperties += 1;
//               }

//               // Update monthly prices for the current year
//               cityGroups[city].monthlyPrices[month].push(price);

//               // Update minPrice and maxPrice for the city
//               if (price < cityGroups[city].minPrice) {
//                 cityGroups[city].minPrice = price;
//               }
//               if (price > cityGroups[city].maxPrice) {
//                 cityGroups[city].maxPrice = price;
//               }
//             }
//           });
//         }
//       }
//     }

//     const groupedProperties = Object.keys(cityGroups).map((city) => {
//       const {
//         minPrice,
//         maxPrice,
//         properties,
//         monthlyPrices,
//         totalPricePerSqft,
//         totalProperties,
//       } = cityGroups[city];

//       // Calculate average price based on total pricePerSqft
//       const averagePricePerSqft =
//         totalProperties > 0 ? totalPricePerSqft / totalProperties : 0;

//       // Calculate monthly average prices for the current year
//       const averagePricesCurrentYear = monthlyPrices.map((prices) => {
//         if (prices.length === 0) {
//           return 0;
//         } else {
//           const totalPrices = prices.reduce((sum, price) => sum + price, 0);
//           return totalPrices / prices.length;
//         }
//       });

//       return {
//         city: city,
//         count: properties.length,
//         minPrice: minPrice,
//         maxPrice: maxPrice,
//         averagePrice: averagePricePerSqft, // Average price based on pricePerSqft
//         averagePricesCurrentYear: averagePricesCurrentYear, // For current year, by month
//       };
//     });

//     // Filter out cities with fewer than 10 properties
//     const filteredProperties = groupedProperties.filter(
//       (group) => group.count >= 3
//     );

//     // Sort the remaining cities alphabetically
//     filteredProperties.sort((a, b) => a.city.localeCompare(b.city));

//     const totalCount = filteredProperties.length;

//     const paginatedProperties =
//       page && limit
//         ? filteredProperties.slice(startIndex, endIndex)
//         : filteredProperties;

//     res
//       .status(200)
//       .json({ groupedProperties: paginatedProperties, totalCount });
//   } catch (error) {
//     console.log(error);
//     return res.status(500).send({ error: "Internal Server Error" });
//   }
// };

// exports.citiesPropertiesTrends = async (req, res) => {
//   try {
//     let page = parseInt(req.query.page);
//     let limit = parseInt(req.query.limit);
//     let startIndex = (page - 1) * limit;
//     let endIndex = page * limit;

//     const currentYear = new Date().getFullYear();

//     let propertyTypeFilter = req.query.propertyType || "";
//     let propertyTypeQuery = {};

//     if (propertyTypeFilter) {
//       if (
//         ["agricultureLand", "coffeeEstate", "farmhouse", "farmland"].includes(
//           propertyTypeFilter
//         )
//       ) {
//         propertyTypeQuery = { propertyType: propertyTypeFilter };
//       } else {
//         return res
//           .status(400)
//           .send({ error: "Property type is not per requirements" });
//       }
//     }

//     const query = req.query.query || "";

//     let searchQuery = query
//       ? {
//           $or: [{ city: { $regex: new RegExp(query), $options: "si" } }],
//         }
//       : {};

//     const combinedQuery = {
//       ...propertyTypeQuery,
//       ...searchQuery,
//     };

//     const properties = await Property.find(combinedQuery);

//     const cityGroups = {};

//     for (const property of properties) {
//       if (property.city) {
//         const cityList = property.city
//           .split(",")
//           .map((city) => city.trim().toLowerCase());
//         const price = parseInt(property.price, 10);
//         const pricePerSqft = parseFloat(property.pricePerSqft);
//         const createdAt = new Date(property.updatedAt);

//         // Only consider properties created in the current year
//         if (createdAt.getFullYear() === currentYear) {
//           const month = createdAt.getMonth(); // Month index: 0 for January, 11 for December

//           cityList.forEach((city) => {
//             if (city) {
//               if (!cityGroups[city]) {
//                 cityGroups[city] = {
//                   properties: [],
//                   minPrice: price,
//                   maxPrice: price,
//                   totalPricePerSqft: 0,
//                   totalProperties: 0,
//                   monthlyPricePerSqft: Array(12).fill(0).map(() => ({
//                     totalPricePerSqft: 0,
//                     count: 0,
//                   })), // For tracking monthly average prices per sqft
//                 };
//               }

//               cityGroups[city].properties.push(property);

//               // Update total price per sqft and property count
//               if (pricePerSqft) {
//                 cityGroups[city].totalPricePerSqft += pricePerSqft;
//                 cityGroups[city].totalProperties += 1;
//                 cityGroups[city].monthlyPricePerSqft[month].totalPricePerSqft +=
//                   pricePerSqft;
//                 cityGroups[city].monthlyPricePerSqft[month].count += 1;
//               }

//               // Update minPrice and maxPrice for the city
//               if (price < cityGroups[city].minPrice) {
//                 cityGroups[city].minPrice = price;
//               }
//               if (price > cityGroups[city].maxPrice) {
//                 cityGroups[city].maxPrice = price;
//               }
//             }
//           });
//         }
//       }
//     }

//     const groupedProperties = Object.keys(cityGroups).map((city) => {
//       const {
//         minPrice,
//         maxPrice,
//         properties,
//         monthlyPricePerSqft,
//         totalPricePerSqft,
//         totalProperties,
//       } = cityGroups[city];

//       // Calculate overall average price per sqft for the city
//       const averagePricePerSqft =
//         totalProperties > 0 ? totalPricePerSqft / totalProperties : 0;

//       // Calculate monthly average price per sqft for the current year
//       let lastKnownAveragePrice = 0; // Track the last known average price
//       const averagePricesCurrentYear = monthlyPricePerSqft.map((monthData, index) => {
//         if (monthData.count > 0) {
//           // If there is data for the month, calculate the average
//           const avgPrice = monthData.totalPricePerSqft / monthData.count;
//           lastKnownAveragePrice = avgPrice; // Update last known price
//           return avgPrice;
//         } else {
//           // If no data for the month, return the last known average price
//           return lastKnownAveragePrice;
//         }
//       });

//       // Calculate price trend (up/down) for each month
//       const priceTrends = [];
//       for (let i = 1; i < 12; i++) {
//         const previousMonth = averagePricesCurrentYear[i - 1];
//         const currentMonth = averagePricesCurrentYear[i];
//         if (previousMonth && currentMonth) {
//           const difference = currentMonth - previousMonth;
//           const percentageChange =
//             (difference / previousMonth) * 100; // Price increase/decrease in percentage
//           priceTrends.push({
//             month: i, // Month index
//             change: percentageChange,
//           });
//         } else {
//           priceTrends.push({
//             month: i,
//             change: 0, // No price change if no data
//           });
//         }
//       }

//       return {
//         city: city,
//         count: properties.length,
//         minPrice: minPrice,
//         maxPrice: maxPrice,
//         averagePrice: averagePricePerSqft, // Overall average price based on pricePerSqft
//         averagePricesCurrentYear: averagePricesCurrentYear, // Monthly average prices per sqft for the current year
//         priceTrends: priceTrends, // Price trends showing percentage up or down
//       };
//     });

//     // Filter out cities with fewer than 3 properties
//     const filteredProperties = groupedProperties.filter(
//       (group) => group.count >= 3
//     );

//     // Sort the remaining cities alphabetically
//     filteredProperties.sort((a, b) => a.city.localeCompare(b.city));

//     const totalCount = filteredProperties.length;

//     const paginatedProperties =
//       page && limit
//         ? filteredProperties.slice(startIndex, endIndex)
//         : filteredProperties;

//     res.status(200).json({
//       groupedProperties: paginatedProperties,
//       totalCount,
//     });
//   } catch (error) {
//     console.log(error);
//     return res.status(500).send({ error: "Internal Server Error" });
//   }
// };

// exports.citiesPropertiesTrends = async (req, res) => {
//   try {
//     console.log("=== CITIES PROPERTIES TRENDS START ===");
//     console.log("Request query params:", req.query);
    
//     let page = parseInt(req.query.page);
//     let limit = parseInt(req.query.limit);
//     let startIndex = (page - 1) * limit;
//     let endIndex = page * limit;
    
//     console.log("Pagination - page:", page, "limit:", limit, "startIndex:", startIndex, "endIndex:", endIndex);

//     let propertyTypeFilter = req.query.propertyType || "";
//     let propertyTypeQuery = {};

//     if (propertyTypeFilter) {
//       console.log("Property type filter applied:", propertyTypeFilter);
//       if (
//         ["agricultureLand", "Estates", "farmhouse", "farmland"].includes(
//           propertyTypeFilter
//         )
//       ) {
//         propertyTypeQuery = { propertyType: propertyTypeFilter };
//         console.log("Valid property type, query set:", propertyTypeQuery);
//       } else {
//         console.log("Invalid property type:", propertyTypeFilter);
//         return res
//           .status(400)
//           .send({ error: "Property type is not per requirements" });
//       }
//     } else {
//       console.log("No property type filter applied");
//     }

//     const query = req.query.query || "";
//     console.log("Search query:", query);

//     let searchQuery = query
//       ? {
//           $or: [{ city: { $regex: new RegExp(query), $options: "si" } }],
//         }
//       : {};

//     const combinedQuery = {
//       ...propertyTypeQuery,
//       ...searchQuery,
//     };
    
//     console.log("Final combined query:", JSON.stringify(combinedQuery, null, 2));

//     console.log("Fetching properties from database...");
//     const properties = await Property.find(combinedQuery);
//     console.log("Total properties found:", properties.length);

//     const cityGroups = {};
//     let processedProperties = 0;
//     let skippedProperties = 0;

//     for (const property of properties) {
//       processedProperties++;
//       if (property.city) {
//         const cityList = property.city
//           .split(",")
//           .map((city) => city.trim().toLowerCase());
//         const price = parseInt(property.price, 10);
//         const pricePerSqft = parseFloat(property.pricePerSqft);
//         const createdAt = new Date(property.updatedAt);
//         const month = createdAt.getMonth();
        
//         if (processedProperties <= 5) { // Log first 5 properties for debugging
//           console.log(`Property ${processedProperties}:`, {
//             propertyTitle: property.propertyTitle,
//             city: property.city,
//             cityList: cityList,
//             price: price,
//             pricePerSqft: pricePerSqft,
//             updatedAt: property.updatedAt,
//             month: month
//           });
//         }

//         cityList.forEach((city) => {
//           if (city) {
//             if (!cityGroups[city]) {
//               console.log("Creating new city group for:", city);
//               cityGroups[city] = {
//                 properties: [],
//                 minPrice: price,
//                 maxPrice: price,
//                 totalPricePerSqft: 0,
//                 totalProperties: 0,
//                 monthlyPricePerSqft: Array(12).fill(0).map(() => ({
//                   totalPricePerSqft: 0,
//                   count: 0,
//                 })),
//               };
//             }

//             cityGroups[city].properties.push(property);

//             // Update total price per sqft and property count
//             if (pricePerSqft) {
//               cityGroups[city].totalPricePerSqft += pricePerSqft;
//               cityGroups[city].totalProperties += 1;
//               cityGroups[city].monthlyPricePerSqft[month].totalPricePerSqft +=
//                 pricePerSqft;
//               cityGroups[city].monthlyPricePerSqft[month].count += 1;
              
//               if (processedProperties <= 5) {
//                 console.log(`Updated city ${city} - month ${month}:`, {
//                   totalPricePerSqft: cityGroups[city].totalPricePerSqft,
//                   totalProperties: cityGroups[city].totalProperties,
//                   monthlyData: cityGroups[city].monthlyPricePerSqft[month]
//                 });
//               }
//             } else {
//               if (processedProperties <= 5) {
//                 console.log(`Property ${processedProperties} has no pricePerSqft data`);
//               }
//             }

//             // Update minPrice and maxPrice for the city
//             if (price < cityGroups[city].minPrice) {
//               cityGroups[city].minPrice = price;
//               if (processedProperties <= 5) {
//                 console.log(`Updated minPrice for ${city}:`, price);
//               }
//             }
//             if (price > cityGroups[city].maxPrice) {
//               cityGroups[city].maxPrice = price;
//               if (processedProperties <= 5) {
//                 console.log(`Updated maxPrice for ${city}:`, price);
//               }
//             }
//           }
//         });
//       } else {
//         skippedProperties++;
//         if (skippedProperties <= 3) {
//           console.log(`Skipped property ${processedProperties} - no city data:`, property.propertyTitle);
//         }
//       }
//     }
    
//     console.log("Processing complete - Processed:", processedProperties, "Skipped:", skippedProperties);
//     console.log("Total cities found:", Object.keys(cityGroups).length);
//     console.log("Cities:", Object.keys(cityGroups));

//     // Console summary: overall and per-city monthly property counts (by updatedAt month)
//     const overallMonthlyCounts = Array(12).fill(0);
//     Object.keys(cityGroups).forEach((city) => {
//       const counts = cityGroups[city].monthlyPricePerSqft.map((monthData) => monthData.count);
//       counts.forEach((count, idx) => {
//         overallMonthlyCounts[idx] += count;
//       });
//     });
//     console.log("Overall monthly counts (Jan..Dec):", overallMonthlyCounts);

//     Object.keys(cityGroups).forEach((city) => {
//       const cityCounts = cityGroups[city].monthlyPricePerSqft.map((monthData) => monthData.count);
//       console.log(`City ${city} monthly counts (Jan..Dec):`, cityCounts);
//     });

//     console.log("Calculating trends for each city...");
//     const groupedProperties = Object.keys(cityGroups).map((city) => {
//       const {
//         minPrice,
//         maxPrice,
//         properties,
//         monthlyPricePerSqft,
//         totalPricePerSqft,
//         totalProperties,
//       } = cityGroups[city];

//       const averagePricePerSqft =
//         totalProperties > 0 ? totalPricePerSqft / totalProperties : 0;

//       let lastKnownAveragePrice = 0;
//       const averagePricesCurrentYear = monthlyPricePerSqft.map((monthData, index) => {
//         if (monthData.count > 0) {
//           const avgPrice = monthData.totalPricePerSqft / monthData.count;
//           lastKnownAveragePrice = avgPrice;
//           return avgPrice;
//         } else {
//           return lastKnownAveragePrice;
//         }
//       });

//       const priceTrends = [];
//       for (let i = 1; i < 12; i++) {
//         const previousMonth = averagePricesCurrentYear[i - 1];
//         const currentMonth = averagePricesCurrentYear[i];
//         if (previousMonth && currentMonth) {
//           const difference = currentMonth - previousMonth;
//           const percentageChange =
//             (difference / previousMonth) * 100;
//           priceTrends.push({
//             month: i,
//             change: percentageChange,
//           });
//         } else {
//           priceTrends.push({
//             month: i,
//             change: 0,
//           });
//         }
//       }

//       const result = {
//         city: city,
//         count: properties.length,
//         minPrice: minPrice,
//         maxPrice: maxPrice,
//         averagePrice: averagePricePerSqft,
//         averagePricesCurrentYear: averagePricesCurrentYear,
//         priceTrends: priceTrends,
//       };
      
//       // Log details for first few cities
//       if (Object.keys(cityGroups).indexOf(city) < 3) {
//         console.log(`City ${city} analysis:`, {
//           count: result.count,
//           minPrice: result.minPrice,
//           maxPrice: result.maxPrice,
//           averagePrice: result.averagePrice,
//           monthlyAverages: result.averagePricesCurrentYear,
//           priceTrends: result.priceTrends.slice(0, 3) // Show first 3 trends
//         });
//       }

//       return result;
//     });

//     console.log("Filtering cities with >= 3 properties...");
//     const filteredProperties = groupedProperties.filter(
//       (group) => group.count >= 3
//     );
//     console.log("Cities before filtering:", groupedProperties.length);
//     console.log("Cities after filtering:", filteredProperties.length);

//     filteredProperties.sort((a, b) => a.city.localeCompare(b.city));
//     console.log("Cities sorted alphabetically");

//     const totalCount = filteredProperties.length;
//     console.log("Total count for pagination:", totalCount);

//     const paginatedProperties =
//       page && limit
//         ? filteredProperties.slice(startIndex, endIndex)
//         : filteredProperties;
    
//     console.log("Final paginated results count:", paginatedProperties.length);
//     console.log("=== CITIES PROPERTIES TRENDS END ===");

//     res.status(200).json({
//       groupedProperties: paginatedProperties,
//       totalCount,
//     });
//   } catch (error) {
//     console.log("ERROR in citiesPropertiesTrends:", error);
//     return res.status(500).send({ error: "Internal Server Error" });
//   }
// };

// exports.statesPropertiesTrends = async (req, res) => {
//   try {
//     let page = parseInt(req.query.page);
//     let limit = parseInt(req.query.limit);
//     let startIndex = (page - 1) * limit;
//     let endIndex = page * limit;

//     // Get the current year
//     const currentYear = new Date().getFullYear();

//     let propertyTypeFilter = req.query.propertyType || "";
//     let propertyTypeQuery = {};

//     if (propertyTypeFilter) {
//       if (
//         ["agricultureLand", "coffeeEstate", "farmhouse", "farmland"].includes(
//           propertyTypeFilter
//         )
//       ) {
//         propertyTypeQuery = { propertyType: propertyTypeFilter };
//       } else {
//         return res
//           .status(400)
//           .send({ error: "Property type is not per requirements" });
//       }
//     }

//     const query = req.query.query || "";

//     let searchQuery = query
//       ? {
//           $or: [{ state: { $regex: new RegExp(query), $options: "si" } }],
//         }
//       : {};

//     const combinedQuery = {
//       ...propertyTypeQuery,
//       ...searchQuery,
//     };

//     const properties = await Property.find(combinedQuery);

//     const stateGroups = {};

//     for (const property of properties) {
//       if (property.state) {
//         const stateList = property.state
//           .split(",")
//           .map((state) => state.trim().toLowerCase());
//         const price = parseInt(property.price, 10);
//         const pricePerSqft = parseFloat(property.pricePerSqft);
//         const createdAt = new Date(property.createdAt);

//         // Only consider properties created in the current year
//         if (createdAt.getFullYear() === currentYear) {
//           const month = createdAt.getMonth(); // Month index: 0 for January, 11 for December

//           stateList.forEach((state) => {
//             if (state) {
//               if (!stateGroups[state]) {
//                 stateGroups[state] = {
//                   properties: [],
//                   minPrice: price,
//                   maxPrice: price,
//                   totalPricePerSqft: 0,
//                   pricePerSqftCount: 0,
//                   monthlyPrices: Array(12)
//                     .fill(0)
//                     .map(() => []),
//                 };
//               }

//               stateGroups[state].properties.push(property);

//               // Update monthly prices for the current year
//               stateGroups[state].monthlyPrices[month].push(price);

//               // Update minPrice and maxPrice for the state
//               if (price < stateGroups[state].minPrice) {
//                 stateGroups[state].minPrice = price;
//               }
//               if (price > stateGroups[state].maxPrice) {
//                 stateGroups[state].maxPrice = price;
//               }

//               // Add pricePerSqft to total and increment count
//               stateGroups[state].totalPricePerSqft += pricePerSqft;
//               stateGroups[state].pricePerSqftCount += 1;
//             }
//           });
//         }
//       }
//     }

//     const groupedProperties = Object.keys(stateGroups).map((state) => {
//       const {
//         minPrice,
//         maxPrice,
//         totalPricePerSqft,
//         pricePerSqftCount,
//         properties,
//         monthlyPrices,
//       } = stateGroups[state];

//       // Calculate the average price based on pricePerSqft
//       const averagePrice =
//         pricePerSqftCount > 0 ? totalPricePerSqft / pricePerSqftCount : 0;

//       // Calculate monthly average prices for the current year
//       let lastKnownAveragePrice = 0;
//       const averagePricesCurrentYear = monthlyPrices.map((prices, index) => {
//         if (prices.length === 0) {
//           // If no data for the month, return the last known average price
//           return lastKnownAveragePrice;
//         } else {
//           // Calculate the average price for the month
//           const totalPrices = prices.reduce((sum, price) => sum + price, 0);
//           const avgPrice = totalPrices / prices.length;
//           lastKnownAveragePrice = avgPrice; // Update last known price
//           return avgPrice;
//         }
//       });

//       return {
//         state: state,
//         count: properties.length,
//         minPrice: minPrice,
//         maxPrice: maxPrice,
//         averagePrice: averagePrice, // Updated to use pricePerSqft for calculation
//         averagePricesCurrentYear: averagePricesCurrentYear, // For current year, by month
//       };
//     });

//     // Filter out states with fewer than 3 properties
//     const filteredProperties = groupedProperties.filter(
//       (group) => group.count >= 3
//     );

//     // Sort the remaining states alphabetically
//     filteredProperties.sort((a, b) => a.state.localeCompare(b.state));

//     const totalCount = filteredProperties.length;

//     const paginatedProperties =
//       page && limit
//         ? filteredProperties.slice(startIndex, endIndex)
//         : filteredProperties;

//     res
//       .status(200)
//       .json({ groupedProperties: paginatedProperties, totalCount });
//   } catch (error) {
//     console.log(error);
//     return res.status(500).send({ error: "Internal Server Error" });
//   }
// };

// exports.statesPropertiesTrends = async (req, res) => {
//   try {
//     let page = parseInt(req.query.page);
//     let limit = parseInt(req.query.limit);
//     let startIndex = (page - 1) * limit;
//     let endIndex = page * limit;

//     let propertyTypeFilter = req.query.propertyType || "";
//     let propertyTypeQuery = {};

//     if (propertyTypeFilter) {
//       if (["agricultureLand", "Estates", "farmhouse", "farmland"].includes(propertyTypeFilter)) {
//         propertyTypeQuery = { propertyType: propertyTypeFilter };
//       } else {
//         return res.status(400).send({ error: "Property type is not per requirements" });
//       }
//     }

//     const query = req.query.query || "";
//     let searchQuery = query ? { $or: [{ state: { $regex: new RegExp(query), $options: "si" } }] } : {};
//     const combinedQuery = { ...propertyTypeQuery, ...searchQuery };

//     const properties = await Property.find(combinedQuery);
//     const stateGroups = {};

//     for (const property of properties) {
//       if (property.state) {
//         const stateList = property.state.split(",").map((state) => state.trim().toLowerCase());
//         const price = parseInt(property.price, 10);
//         const pricePerSqft = parseFloat(property.pricePerSqft);
//         const createdAt = new Date(property.updatedAt);
//         const month = createdAt.getMonth();

//         stateList.forEach((state) => {
//           if (state) {
//             if (!stateGroups[state]) {
//               stateGroups[state] = {
//                 properties: [],
//                 minPrice: price,
//                 maxPrice: price,
//                 totalPricePerSqft: 0,
//                 totalProperties: 0,
//                 monthlyPricePerSqft: Array(12).fill(0).map(() => ({
//                   totalPricePerSqft: 0,
//                   count: 0,
//                 })),
//               };
//             }

//             stateGroups[state].properties.push(property);

//             if (pricePerSqft) {
//               stateGroups[state].totalPricePerSqft += pricePerSqft;
//               stateGroups[state].totalProperties += 1;
//               stateGroups[state].monthlyPricePerSqft[month].totalPricePerSqft += pricePerSqft;
//               stateGroups[state].monthlyPricePerSqft[month].count += 1;
//             }

//             if (price < stateGroups[state].minPrice) {
//               stateGroups[state].minPrice = price;
//             }
//             if (price > stateGroups[state].maxPrice) {
//               stateGroups[state].maxPrice = price;
//             }
//           }
//         });
//       }
//     }

//     const groupedProperties = Object.keys(stateGroups).map((state) => {
//       const { minPrice, maxPrice, properties, monthlyPricePerSqft, totalPricePerSqft, totalProperties } = stateGroups[state];
//       const averagePricePerSqft = totalProperties > 0 ? totalPricePerSqft / totalProperties : 0;

//       let lastKnownAveragePrice = 0;
//       const averagePricesCurrentYear = monthlyPricePerSqft.map((monthData) => {
//         if (monthData.count > 0) {
//           const avgPrice = monthData.totalPricePerSqft / monthData.count;
//           lastKnownAveragePrice = avgPrice;
//           return avgPrice;
//         } else {
//           return lastKnownAveragePrice;
//         }
//       });

//       const priceTrends = [];
//       for (let i = 1; i < 12; i++) {
//         const previousMonth = averagePricesCurrentYear[i - 1];
//         const currentMonth = averagePricesCurrentYear[i];
//         if (previousMonth && currentMonth) {
//           const difference = currentMonth - previousMonth;
//           const percentageChange = (difference / previousMonth) * 100;
//           priceTrends.push({ month: i, change: percentageChange });
//         } else {
//           priceTrends.push({ month: i, change: 0 });
//         }
//       }

//       return {
//         state: state,
//         count: properties.length,
//         minPrice: minPrice,
//         maxPrice: maxPrice,
//         averagePrice: averagePricePerSqft,
//         averagePricesCurrentYear: averagePricesCurrentYear,
//         priceTrends: priceTrends,
//       };
//     });

//     const filteredProperties = groupedProperties.filter((group) => group.count >= 3);
//     filteredProperties.sort((a, b) => a.state.localeCompare(b.state));
//     const totalCount = filteredProperties.length;
//     const paginatedProperties = page && limit ? filteredProperties.slice(startIndex, endIndex) : filteredProperties;

//     res.status(200).json({ groupedProperties: paginatedProperties, totalCount });
//   } catch (error) {
//     console.log(error);
//     return res.status(500).send({ error: "Internal Server Error" });
//   }
// };

exports.statesPropertiesTrends = async (req, res) => {
  try {
    let page = parseInt(req.query.page);
    let limit = parseInt(req.query.limit);
    let startIndex = (page - 1) * limit;
    let endIndex = page * limit;

    let propertyTypeFilter = req.query.propertyType || "";
    let propertyTypeQuery = {};

    if (propertyTypeFilter) {
      if (["agricultureLand", "Estates", "farmhouse", "farmland"].includes(propertyTypeFilter)) {
        propertyTypeQuery = { propertyType: propertyTypeFilter };
      } else {
        return res.status(400).send({ error: "Property type is not per requirements" });
      }
    }

    const query = req.query.query || "";
    let searchQuery = query ? { $or: [{ state: { $regex: new RegExp(query), $options: "si" } }] } : {};
    const combinedQuery = { ...propertyTypeQuery, ...searchQuery };

    const properties = await Property.find(combinedQuery);
    const stateGroups = {};

    for (const property of properties) {
      if (property.state) {
        const stateList = property.state.split(",").map((state) => state.trim().toLowerCase());
        const price = parseInt(property.price, 10);
        const pricePerSqft = parseFloat(property.pricePerSqft);
        const createdAt = new Date(property.updatedAt);
        const month = createdAt.getMonth();

        stateList.forEach((state) => {
          if (state) {
            if (!stateGroups[state]) {
              stateGroups[state] = {
                properties: [],
                minPrice: price,
                maxPrice: price,
                totalPricePerSqft: 0,
                totalProperties: 0,
                monthlyPricePerSqft: Array(12).fill(0).map(() => ({
                  totalPricePerSqft: 0,
                  count: 0,
                })),
              };
            }

            stateGroups[state].properties.push(property);

            if (pricePerSqft) {
              stateGroups[state].totalPricePerSqft += pricePerSqft;
              stateGroups[state].totalProperties += 1;
              stateGroups[state].monthlyPricePerSqft[month].totalPricePerSqft += pricePerSqft;
              stateGroups[state].monthlyPricePerSqft[month].count += 1;
            }

            if (price < stateGroups[state].minPrice) {
              stateGroups[state].minPrice = price;
            }
            if (price > stateGroups[state].maxPrice) {
              stateGroups[state].maxPrice = price;
            }
          }
        });
      }
    }

    const groupedProperties = Object.keys(stateGroups).map((state) => {
      const { minPrice, maxPrice, properties, monthlyPricePerSqft, totalPricePerSqft, totalProperties } = stateGroups[state];
      const averagePricePerSqft = totalProperties > 0 ? totalPricePerSqft / totalProperties : 0;

      let smoothedAverage = 0;
      const averagePricesCurrentYear = monthlyPricePerSqft.map((monthData, idx) => {
        if (monthData.count > 0) {
          const currentAvg = monthData.totalPricePerSqft / monthData.count;
          smoothedAverage = smoothedAverage === 0 ? currentAvg : (smoothedAverage + currentAvg) / 2;
          return smoothedAverage;
        } else {
          return smoothedAverage;
        }
      });

      // Convert to cumulative sum of monthly averages (prev + current)
      const cumulativeAveragePrices = [...averagePricesCurrentYear];
      for (let i = 1; i < cumulativeAveragePrices.length; i++) {
        cumulativeAveragePrices[i] = cumulativeAveragePrices[i - 1] + (averagePricesCurrentYear[i] || 0);
      }

      const priceTrends = [];
      for (let i = 1; i < 12; i++) {
        const previousMonth = cumulativeAveragePrices[i - 1];
        const currentMonth = cumulativeAveragePrices[i];
        if (previousMonth && currentMonth) {
          const difference = currentMonth - previousMonth;
          const percentageChange = (difference / previousMonth) * 100;
          priceTrends.push({ month: i, change: percentageChange });
        } else {
          priceTrends.push({ month: i, change: 0 });
        }
      }

      return {
        state: state,
        count: properties.length,
        minPrice: minPrice,
        maxPrice: maxPrice,
        averagePrice: averagePricePerSqft,
        averagePricesCurrentYear: cumulativeAveragePrices,
        priceTrends: priceTrends,
      };
    });

    const filteredProperties = groupedProperties.filter((group) => group.count >= 3);
    filteredProperties.sort((a, b) => a.state.localeCompare(b.state));
    const totalCount = filteredProperties.length;
    const paginatedProperties = page && limit ? filteredProperties.slice(startIndex, endIndex) : filteredProperties;

    res.status(200).json({ groupedProperties: paginatedProperties, totalCount });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ error: "Internal Server Error" });
  }
};


// Anchan.............................................................................
exports.citiesPropertiesTrends = async (req, res) => {
  try {
    console.log("=== CITIES PROPERTIES TRENDS START ===");
    console.log("Request query params:", req.query);
    
    let page = parseInt(req.query.page);
    let limit = parseInt(req.query.limit);
    let startIndex = (page - 1) * limit;
    let endIndex = page * limit;
    
    console.log("Pagination - page:", page, "limit:", limit, "startIndex:", startIndex, "endIndex:", endIndex);

    let propertyTypeFilter = req.query.propertyType || "";
    let propertyTypeQuery = {};

    if (propertyTypeFilter) {
      console.log("Property type filter applied:", propertyTypeFilter);
      if (
        ["agricultureLand", "Estates", "farmhouse", "farmland"].includes(
          propertyTypeFilter
        )
      ) {
        propertyTypeQuery = { propertyType: propertyTypeFilter };
        console.log("Valid property type, query set:", propertyTypeQuery);
      } else {
        console.log("Invalid property type:", propertyTypeFilter);
        return res
          .status(400)
          .send({ error: "Property type is not per requirements" });
      }
    } else {
      console.log("No property type filter applied");
    }

    const query = req.query.query || "";
    console.log("Search query:", query);

    let searchQuery = query
      ? {
          $or: [{ city: { $regex: new RegExp(query), $options: "si" } }],
        }
      : {};

    const combinedQuery = {
      ...propertyTypeQuery,
      ...searchQuery,
    };
    
    console.log("Final combined query:", JSON.stringify(combinedQuery, null, 2));

    console.log("Fetching properties from database...");
    const properties = await Property.find(combinedQuery);
    console.log("Total properties found:", properties.length);

    const cityGroups = {};
    let processedProperties = 0;
    let skippedProperties = 0;

    for (const property of properties) {
      processedProperties++;
      if (property.city) {
        const cityList = property.city
          .split(",")
          .map((city) => city.trim().toLowerCase());
        const price = parseInt(property.price, 10);
        const pricePerSqft = parseFloat(property.pricePerSqft);
        const createdAt = new Date(property.updatedAt);
        const month = createdAt.getMonth();
        
        if (processedProperties <= 5) { // Log first 5 properties for debugging
          console.log(`Property ${processedProperties}:`, {
            propertyTitle: property.propertyTitle,
            city: property.city,
            cityList: cityList,
            price: price,
            pricePerSqft: pricePerSqft,
            updatedAt: property.updatedAt,
            month: month
          });
        }

        cityList.forEach((city) => {
          if (city) {
            if (!cityGroups[city]) {
              console.log("Creating new city group for:", city);
              cityGroups[city] = {
                properties: [],
                minPrice: price,
                maxPrice: price,
                totalPricePerSqft: 0,
                totalProperties: 0,
                monthlyPricePerSqft: Array(12).fill(0).map(() => ({
                  totalPricePerSqft: 0,
                  count: 0,
                })),
              };
            }

            cityGroups[city].properties.push(property);

            // Update total price per sqft and property count
            if (pricePerSqft) {
              cityGroups[city].totalPricePerSqft += pricePerSqft;
              cityGroups[city].totalProperties += 1;
              cityGroups[city].monthlyPricePerSqft[month].totalPricePerSqft +=
                pricePerSqft;
              cityGroups[city].monthlyPricePerSqft[month].count += 1;
              
              if (processedProperties <= 5) {
                console.log(`Updated city ${city} - month ${month}:`, {
                  totalPricePerSqft: cityGroups[city].totalPricePerSqft,
                  totalProperties: cityGroups[city].totalProperties,
                  monthlyData: cityGroups[city].monthlyPricePerSqft[month]
                });
              }
            } else {
              if (processedProperties <= 5) {
                console.log(`Property ${processedProperties} has no pricePerSqft data`);
              }
            }

            // Update minPrice and maxPrice for the city
            if (price < cityGroups[city].minPrice) {
              cityGroups[city].minPrice = price;
              if (processedProperties <= 5) {
                console.log(`Updated minPrice for ${city}:`, price);
              }
            }
            if (price > cityGroups[city].maxPrice) {
              cityGroups[city].maxPrice = price;
              if (processedProperties <= 5) {
                console.log(`Updated maxPrice for ${city}:`, price);
              }
            }
          }
        });
      } else {
        skippedProperties++;
        if (skippedProperties <= 3) {
          console.log(`Skipped property ${processedProperties} - no city data:`, property.propertyTitle);
        }
      }
    }
    
    console.log("Processing complete - Processed:", processedProperties, "Skipped:", skippedProperties);
    console.log("Total cities found:", Object.keys(cityGroups).length);
    console.log("Cities:", Object.keys(cityGroups));

    // Console summary: overall and per-city monthly property counts (by updatedAt month)
    const overallMonthlyCounts = Array(12).fill(0);
    Object.keys(cityGroups).forEach((city) => {
      const counts = cityGroups[city].monthlyPricePerSqft.map((monthData) => monthData.count);
      counts.forEach((count, idx) => {
        overallMonthlyCounts[idx] += count;
      });
    });
    console.log("Overall monthly counts (Jan..Dec):", overallMonthlyCounts);

    Object.keys(cityGroups).forEach((city) => {
      const cityCounts = cityGroups[city].monthlyPricePerSqft.map((monthData) => monthData.count);
      console.log(`City ${city} monthly counts (Jan..Dec):`, cityCounts);
    });

    console.log("Calculating trends for each city...");
    const groupedProperties = Object.keys(cityGroups).map((city) => {
      const {
        minPrice,
        maxPrice,
        properties,
        monthlyPricePerSqft,
        totalPricePerSqft,
        totalProperties,
      } = cityGroups[city];

      const averagePricePerSqft =
        totalProperties > 0 ? totalPricePerSqft / totalProperties : 0;

      let lastKnownAveragePrice = 0;
      const averagePricesCurrentYear = monthlyPricePerSqft.map((monthData, index) => {
        if (monthData.count > 0) {
          const avgPrice = monthData.totalPricePerSqft / monthData.count;
          lastKnownAveragePrice = avgPrice;
          return avgPrice;
        } else {
          return lastKnownAveragePrice;
        }
      });

      // Convert to cumulative sum of monthly averages (prev + current)
      const cumulativeAveragePrices = [...averagePricesCurrentYear];
      for (let i = 1; i < cumulativeAveragePrices.length; i++) {
        cumulativeAveragePrices[i] = cumulativeAveragePrices[i - 1] + (averagePricesCurrentYear[i] || 0);
      }

      const priceTrends = [];
      for (let i = 1; i < 12; i++) {
        const previousMonth = cumulativeAveragePrices[i - 1];
        const currentMonth = cumulativeAveragePrices[i];
        if (previousMonth && currentMonth) {
          const difference = currentMonth - previousMonth;
          const percentageChange =
            (difference / previousMonth) * 100;
          priceTrends.push({
            month: i,
            change: percentageChange,
          });
        } else {
          priceTrends.push({
            month: i,
            change: 0,
          });
        }
      }

      const result = {
        city: city,
        count: properties.length,
        minPrice: minPrice,
        maxPrice: maxPrice,
        averagePrice: averagePricePerSqft,
        averagePricesCurrentYear: cumulativeAveragePrices,
        priceTrends: priceTrends,
      };
      
      // Log details for first few cities
      if (Object.keys(cityGroups).indexOf(city) < 3) {
        console.log(`City ${city} analysis:`, {
          count: result.count,
          minPrice: result.minPrice,
          maxPrice: result.maxPrice,
          averagePrice: result.averagePrice,
          monthlyAverages: result.averagePricesCurrentYear,
          priceTrends: result.priceTrends.slice(0, 3) // Show first 3 trends
        });
      }

      return result;
    });

    console.log("Filtering cities with >= 3 properties...");
    const filteredProperties = groupedProperties.filter(
      (group) => group.count >= 3
    );
    console.log("Cities before filtering:", groupedProperties.length);
    console.log("Cities after filtering:", filteredProperties.length);

    filteredProperties.sort((a, b) => a.city.localeCompare(b.city));
    console.log("Cities sorted alphabetically");

    const totalCount = filteredProperties.length;
    console.log("Total count for pagination:", totalCount);

    const paginatedProperties =
      page && limit
        ? filteredProperties.slice(startIndex, endIndex)
        : filteredProperties;
    
    console.log("Final paginated results count:", paginatedProperties.length);
    console.log("=== CITIES PROPERTIES TRENDS END ===");

    res.status(200).json({
      groupedProperties: paginatedProperties,
      totalCount,
    });
  } catch (error) {
    console.log("ERROR in citiesPropertiesTrends:", error);
    return res.status(500).send({ error: "Internal Server Error" });
  }
};
