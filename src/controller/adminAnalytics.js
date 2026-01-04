const Property = require("../model/property.model");
const Seller = require("../model/seller.model");
const User = require("../model/users.model.js");
const PropertyCategory = require("../model/propertyCategory.model.js");
const Category = require("../model/category");
const Blogs = require("../model/blogs");
const Faq = require("../model/faqs");
const Footer = require("../model/manageFooter");
const Inquiry = require("../model/enquiry.model");
const Saved = require("../model/buyerSaved");
const Message = require("../model/message.model");
const Subscription = require("../model/sellerSub.model");

exports.getAnalytics = async (req, res) => {
  try {
    const { period, startDate, endDate } = req.query;
    let dateFilter = null;
    let days = 0;

    if (period) {
      if (period === "7") days = 7;
      else if (period === "15") days = 15;
      else if (period === "30") days = 30;

      if (days > 0) {
        const calculatedStartDate = new Date();
        calculatedStartDate.setDate(calculatedStartDate.getDate() - days);
        dateFilter = { $gte: calculatedStartDate };
      }
    }

    if (period === "custom" && startDate && endDate) {
      const customStartDate = new Date(startDate);
      const customEndDate = new Date(endDate);
      customEndDate.setHours(23, 59, 59, 999);

      if (!isNaN(customStartDate) && !isNaN(customEndDate)) {
        dateFilter = { $gte: customStartDate, $lte: customEndDate };
      }
    }

    const page = parseInt(req.query.page) || 1;
    const limit = req.query.limit ? parseInt(req.query.limit) : null;
    const skip = (page - 1) * (limit || 0);

    // Define sevenDaysAgo variable
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 365);

    // Fetch archived properties
    const archivedProperties = await Property.find({
      isDeleted: true,
      updatedAt: dateFilter || {
        $gte: new Date(new Date().setFullYear(new Date().getFullYear() - 1)),
      },
    })
      .select("propertyTitle createdAt updatedAt editBy")
      .sort({ updatedAt: -1, createdAt: -1 });

    const archiveResponses = await Promise.all(
      archivedProperties.map(async (property) => {
        let editedByDetails = "Unknown";
        if (property.editBy) {
          if (property.editBy.equals(req.user._id)) {
            editedByDetails = "you";
          } else {
            const user = await User.findById(property.editBy);
            if (user) {
              editedByDetails = user.username;
            } else {
              const seller = await Seller.findById(property.editBy);
              if (seller) {
                editedByDetails = seller.fullName;
              }
            }
          }
        }
        const action = "moved to archive";
        const title = property.propertyTitle;
        const fullName = editedByDetails;
        const updatedAt = property.updatedAt.toISOString();

        return {
          type: "Property Archive",
          //message: `Property ${title} was ${action} by ${fullName}`,
          entity: `${title}`,
          message: `Property Moved to Archive`,
          userName: `${fullName}`,
          time: `last updated at ${updatedAt}`,
          updatedAt: property.updatedAt,
        };
      })
    );

    // Fetch sold-out properties
    const soldProperties = await Property.find({
      propertyStatus: "sold-out",
      updatedAt: dateFilter || {
        $gte: new Date(new Date().setFullYear(new Date().getFullYear() - 1)),
      },
    })
      .select("propertyTitle createdAt updatedAt editBy")
      .sort({ updatedAt: -1, createdAt: -1 });

    const soldResponses = await Promise.all(
      soldProperties.map(async (property) => {
        let editedByDetails = "Unknown";
        if (property.editBy) {
          if (property.editBy.equals(req.user._id)) {
            editedByDetails = "you";
          } else {
            const user = await User.findById(property.editBy);
            if (user) {
              editedByDetails = user.username;
            } else {
              const seller = await Seller.findById(property.editBy);
              if (seller) {
                editedByDetails = seller.fullName;
              }
            }
          }
        }
        const action = "moved to sold-out";
        const title = property.propertyTitle;
        const fullName = editedByDetails;
        const updatedAt = property.updatedAt.toISOString();

        return {
          type: "Property Sold-Out",
          //message: `Property ${title} was ${action} by ${fullName}`,
          entity: `${title}`,
          message: `Property Marked Sold-Out`,
          userName: `${fullName}`,
          time: `last updated at ${updatedAt}`,
          updatedAt: property.updatedAt,
        };
      })
    );

    // Fetch reject properties
    const rejectProperties = await Property.find({
      propertyApproval: "Reject",
      updatedAt: dateFilter || {
        $gte: new Date(new Date().setFullYear(new Date().getFullYear() - 1)),
      },
    })
      .select("propertyTitle createdAt updatedAt editBy")
      .sort({ updatedAt: -1, createdAt: -1 });

    const rejectResponses = await Promise.all(
      rejectProperties.map(async (property) => {
        let editedByDetails = "Unknown";
        if (property.editBy) {
          if (property.editBy.equals(req.user._id)) {
            editedByDetails = "you";
          } else {
            const user = await User.findById(property.editBy);
            if (user) {
              editedByDetails = user.username;
            } else {
              const seller = await Seller.findById(property.editBy);
              if (seller) {
                editedByDetails = seller.fullName;
              }
            }
          }
        }
        const action = "Rejected";
        const title = property.propertyTitle;
        const fullName = editedByDetails;
        const updatedAt = property.updatedAt.toISOString();

        return {
          type: "Property Rejected",
          //   message: `Property ${title} was ${action} by ${fullName}`,
          entity: `${title}`,
          message: `Property Mark Rejected`,
          userName: `${fullName}`,
          time: `last updated at ${updatedAt}`,
          updatedAt: property.updatedAt,
        };
      })
    );

    // Fetch recent properties created or updated
    const recentProperties = await Property.find({
      $or: [
        {
          createdAt: dateFilter || {
            $gte: new Date(
              new Date().setFullYear(new Date().getFullYear() - 1)
            ),
          },
        },
        {
          updatedAt: dateFilter || {
            $gte: new Date(
              new Date().setFullYear(new Date().getFullYear() - 1)
            ),
          },
        },
      ],
    })
      .select("propertyTitle createdAt updatedAt editBy")
      .sort({ updatedAt: -1, createdAt: -1 });

    const propertyResponses = await Promise.all(
      recentProperties.map(async (property) => {
        let editedByDetails = "Unknown";

        if (property.editBy) {
          if (property.editBy.equals(req.user._id)) {
            editedByDetails = "you";
          } else {
            const user = await User.findById(property.editBy);
            if (user) {
              editedByDetails = user.username;
            } else {
              const seller = await Seller.findById(property.editBy);
              if (seller) {
                editedByDetails = seller.fullName;
              }
            }
          }
        }

        // Determine whether the property is new or updated
        const createdDate = property.createdAt;
        const updatedDate = property.updatedAt;
        const oneYearAgo = new Date(
          new Date().setFullYear(new Date().getFullYear() - 1)
        );
        const sevenDaysAgo = new Date(
          new Date().setDate(new Date().getDate() - 7)
        );

        //if the property was created or updated based on dates
        const isRecentlyCreated =
          createdDate >= (dateFilter ? oneYearAgo : sevenDaysAgo);
        const action =
          updatedDate > createdDate
            ? "updated"
            : isRecentlyCreated
            ? "created"
            : "updated";

        const title = property.propertyTitle;
        const fullName = editedByDetails;
        const updatedAt = property.updatedAt.toISOString();

        return {
          type: "Property",
          //message: `Property ${title} was ${action} by ${fullName}`,
          entity: `${title}`,
          message: `Property was ${action}`,
          userName: `${fullName}`,
          time: `last updated at ${updatedAt}`,
          updatedAt: property.updatedAt,
        };
      })
    );

    // Fetch recent blogs
    const recentBlogs = await Blogs.find({
      $or: [
        {
          createdAt: dateFilter || {
            $gte: new Date(
              new Date().setFullYear(new Date().getFullYear() - 1)
            ),
          },
        },
        {
          updatedAt: dateFilter || {
            $gte: new Date(
              new Date().setFullYear(new Date().getFullYear() - 1)
            ),
          },
        },
      ],
    })
      .select("title createdAt updatedAt admin")
      .sort({ updatedAt: -1, createdAt: -1 });

    const blogResponses = await Promise.all(
      recentBlogs.map(async (blog) => {
        let editedByDetails = "Unknown";
        if (blog.admin) {
          if (blog.admin.equals(req.user._id)) {
            editedByDetails = "you";
          } else {
            const user = await User.findById(blog.admin);
            if (user) {
              editedByDetails = user.username;
            } else {
              const seller = await Seller.findById(blog.admin);
              if (seller) {
                editedByDetails = seller.fullName;
              }
            }
          }
        }

        //to check the blog is new or updated
        const createdDate = blog.createdAt;
        const updatedDate = blog.updatedAt;
        const oneYearAgo = new Date(
          new Date().setFullYear(new Date().getFullYear() - 1)
        );
        const sevenDaysAgo = new Date(
          new Date().setDate(new Date().getDate() - 7)
        );

        // if the blog was created or updated based on dates
        const isRecentlyCreated =
          createdDate >= (dateFilter ? oneYearAgo : sevenDaysAgo);
        const action =
          updatedDate > createdDate
            ? "updated"
            : isRecentlyCreated
            ? "created"
            : "updated";

        const title = blog.title;
        const fullName = editedByDetails;
        const updatedAt = blog.updatedAt.toISOString();

        return {
          type: "Blog",
          //message: `Blog ${title} was ${action} by ${fullName}`,
          entity: `${title}`,
          message: `Blog was ${action}`,
          userName: `${fullName}`,
          time: `last updated at ${updatedAt}`,
          updatedAt: blog.updatedAt,
        };
      })
    );

    // Fetch recent categories created or updated
    const recentCategory = await Category.find({
      $or: [
        {
          createdAt: dateFilter || {
            $gte: new Date(
              new Date().setFullYear(new Date().getFullYear() - 1)
            ),
          },
        },
        {
          updatedAt: dateFilter || {
            $gte: new Date(
              new Date().setFullYear(new Date().getFullYear() - 1)
            ),
          },
        },
      ],
    })
      .select("categoryName category createdAt updatedAt editBy")
      .sort({ updatedAt: -1, createdAt: -1 });

    const categoryResponses = await Promise.all(
      recentCategory.map(async (category) => {
        let editedByDetails = "Unknown";
        if (category.editBy) {
          if (category.editBy.equals(req.user._id)) {
            editedByDetails = "you";
          } else {
            const user = await User.findById(category.editBy);
            if (user) {
              editedByDetails = user.username;
            } else {
              const seller = await Seller.findById(category.editBy);
              if (seller) {
                editedByDetails = seller.fullName;
              }
            }
          }
        }

        //  whether the category is new or updated
        const createdDate = category.createdAt;
        const updatedDate = category.updatedAt;
        const oneYearAgo = new Date(
          new Date().setFullYear(new Date().getFullYear() - 1)
        );
        const sevenDaysAgo = new Date(
          new Date().setDate(new Date().getDate() - 7)
        );

        // if the category was created or updated based on dates
        const isRecentlyCreated =
          createdDate >= (dateFilter ? oneYearAgo : sevenDaysAgo);
        const action =
          updatedDate > createdDate
            ? "updated"
            : isRecentlyCreated
            ? "created"
            : "updated";

        const title = category.category;
        const fullName = editedByDetails;
        const updatedAt = category.updatedAt.toISOString();

        return {
          type: "Blog Category",
          //message: `Blog Category ${title} was ${action} by ${fullName}`,
          entity: `${title}`,
          message: `Blog Category was ${action}`,
          userName: `${fullName}`,
          time: `last updated at ${updatedAt}`,
          updatedAt: category.updatedAt,
        };
      })
    );

    //Faq recent activities cretaed/updated
    const faqResponses = await Faq.find({
      $or: [
        {
          createdAt: dateFilter || {
            $gte: new Date(
              new Date().setFullYear(new Date().getFullYear() - 1)
            ),
          },
        },
        {
          updatedAt: dateFilter || {
            $gte: new Date(
              new Date().setFullYear(new Date().getFullYear() - 1)
            ),
          },
        },
      ],
    })
      .select("question createdAt updatedAt admin")
      .sort({ updatedAt: -1, createdAt: -1 });

    const faqResponsesFormatted = await Promise.all(
      faqResponses.map(async (faq) => {
        let editedByDetails = "Unknown";

        // Determine who edited the FAQ
        if (faq.admin) {
          if (faq.admin.equals(req.user._id)) {
            editedByDetails = "you";
          } else {
            const user = await User.findById(faq.admin);
            if (user) {
              editedByDetails = user.username;
            } else {
              const seller = await Seller.findById(faq.admin);
              if (seller) {
                editedByDetails = seller.fullName;
              }
            }
          }
        }

        // Determine whether the FAQ is new or updated
        const createdDate = faq.createdAt;
        const updatedDate = faq.updatedAt;
        const oneYearAgo = new Date(
          new Date().setFullYear(new Date().getFullYear() - 1)
        );
        const sevenDaysAgo = new Date(
          new Date().setDate(new Date().getDate() - 7)
        );

        // Determine if the FAQ was created or updated based on dates
        const isRecentlyCreated =
          createdDate >= (dateFilter ? oneYearAgo : sevenDaysAgo);
        const action =
          updatedDate > createdDate
            ? "updated"
            : isRecentlyCreated
            ? "created"
            : "updated";

        // Construct the response message
        const title = faq.question;
        const fullName = editedByDetails;
        const updatedAt = faq.updatedAt.toISOString();

        return {
          type: "FAQ",
          //message: `A FAQ titled ${title} was ${action} by ${fullName}`,
          entity: `${title}`,
          message: `A FAQ was ${action}`,
          userName: `${fullName}`,
          time: `last updated at ${updatedAt}`,
          updatedAt: faq.updatedAt,
        };
      })
    );

    //recent activities for footer created/updated
    const footerResponsesFormatted = await Footer.find({
      $or: [
        {
          createdAt: dateFilter || {
            $gte: new Date(
              new Date().setFullYear(new Date().getFullYear() - 1)
            ),
          },
        },
        {
          updatedAt: dateFilter || {
            $gte: new Date(
              new Date().setFullYear(new Date().getFullYear() - 1)
            ),
          },
        },
      ],
    })
      .select("title link createdAt updatedAt admin status")
      .sort({ updatedAt: -1, createdAt: -1 });

    const footerResponses = await Promise.all(
      footerResponsesFormatted.map(async (footer) => {
        let editedByDetails = "Unknown";
        if (footer.admin) {
          if (footer.admin.equals(req.user._id)) {
            editedByDetails = "you";
          } else {
            const user = await User.findById(footer.admin);
            if (user) {
              editedByDetails = user.username;
            } else {
              const seller = await Seller.findById(footer.admin);
              if (seller) {
                editedByDetails = seller.fullName;
              }
            }
          }
        }

        //whether the footer is new or updated
        const createdDate = footer.createdAt;
        const updatedDate = footer.updatedAt;
        const oneYearAgo = new Date(
          new Date().setFullYear(new Date().getFullYear() - 1)
        );
        const sevenDaysAgo = new Date(
          new Date().setDate(new Date().getDate() - 7)
        );

        //if the footer was created or updated based on dates
        const isRecentlyCreated =
          createdDate >= (dateFilter ? oneYearAgo : sevenDaysAgo);
        const action =
          updatedDate > createdDate
            ? "updated"
            : isRecentlyCreated
            ? "created"
            : "updated";

        const title = footer.title;
        const fullName = editedByDetails;
        const updatedAt = footer.updatedAt.toISOString();

        return {
          type: "Footer",
          //message: `Footer ${title} was ${action} by ${fullName}`,
          entity: `${title}`,
          message: `Footer was ${action}`,
          userName: `${fullName}`,
          time: `last updated at ${updatedAt}`,
          updatedAt: footer.updatedAt,
        };
      })
    );

    //fetch property category activities created/updated
    const recentPropertyCategory = await PropertyCategory.find({
      $or: [
        {
          createdAt: dateFilter || {
            $gte: new Date(
              new Date().setFullYear(new Date().getFullYear() - 1)
            ),
          },
        },
        {
          updatedAt: dateFilter || {
            $gte: new Date(
              new Date().setFullYear(new Date().getFullYear() - 1)
            ),
          },
        },
      ],
    })
      .select("categoryName createdAt updatedAt admin")
      .sort({ updatedAt: -1, createdAt: -1 });

    const propertyCategoryResponses = await Promise.all(
      recentPropertyCategory.map(async (Category) => {
        let editedByDetails = "Unknown";
        if (Category.admin) {
          if (Category.admin.equals(req.user._id)) {
            editedByDetails = "you";
          } else {
            const user = await User.findById(Category.admin);
            if (user) {
              editedByDetails = user.username;
            } else {
              const seller = await Seller.findById(Category.admin);
              if (seller) {
                editedByDetails = seller.fullName;
              }
            }
          }
        }

        //whether the property category is new or updated
        const createdDate = Category.createdAt;
        const updatedDate = Category.updatedAt;
        const oneYearAgo = new Date(
          new Date().setFullYear(new Date().getFullYear() - 1)
        );
        const sevenDaysAgo = new Date(
          new Date().setDate(new Date().getDate() - 7)
        );

        //if the property category was created or updated based on dates
        const isRecentlyCreated =
          createdDate >= (dateFilter ? oneYearAgo : sevenDaysAgo);
        const action =
          updatedDate > createdDate
            ? "updated"
            : isRecentlyCreated
            ? "created"
            : "updated";

        const title = Category.categoryName;
        const fullName = editedByDetails;
        const updatedAt = Category.updatedAt.toISOString();

        return {
          type: "Property Category",
          //message: `Property Category ${title} was ${action} by ${fullName}`,
          entity: `${title}`,
          message: `Property was ${action}`,
          userName: `${fullName}`,
          time: `last updated at ${updatedAt}`,
          updatedAt: Category.updatedAt,
        };
      })
    );

    //fetch recent users activitys created/updated
    const recentUsers = await User.find({
      $or: [
        {
          createdAt: dateFilter || {
            $gte: new Date(
              new Date().setFullYear(new Date().getFullYear() - 1)
            ),
          },
        },
        {
          updatedAt: dateFilter || {
            $gte: new Date(
              new Date().setFullYear(new Date().getFullYear() - 1)
            ),
          },
        },
      ],
    })
      .select("username createdAt updatedAt admin")
      .sort({ updatedAt: -1, createdAt: -1 });

    const recentUsersResponses = await Promise.all(
      recentUsers.map(async (Category) => {
        let editedByDetails = "Unknown";
        if (Category.admin) {
          if (Category.admin.equals(req.user._id)) {
            editedByDetails = "you";
          } else {
            const user = await User.findById(Category.admin);
            if (user) {
              editedByDetails = user.username;
            } else {
              const seller = await Seller.findById(Category.admin);
              if (seller) {
                editedByDetails = seller.fullName;
              }
            }
          }
        }

        //whether the user is new or updated
        const createdDate = Category.createdAt;
        const updatedDate = Category.updatedAt;
        const oneYearAgo = new Date(
          new Date().setFullYear(new Date().getFullYear() - 1)
        );
        const sevenDaysAgo = new Date(
          new Date().setDate(new Date().getDate() - 7)
        );

        //if the user was created or updated based on dates
        const isRecentlyCreated =
          createdDate >= (dateFilter ? oneYearAgo : sevenDaysAgo);
        const action =
          updatedDate > createdDate
            ? "updated"
            : isRecentlyCreated
            ? "created"
            : "updated";

        const title = Category.username;
        const fullName = editedByDetails;
        const updatedAt = Category.updatedAt.toISOString();

        return {
          type: "Users",
          //message: `User ${title} was ${action} by ${fullName}`,
          entity: `${title}`,
          message: `User was ${action}`,
          userName: `${fullName}`,
          time: `last updated at ${updatedAt}`,
          updatedAt: Category.updatedAt,
        };
      })
    );

    const allResponses = [
      ...archiveResponses,
      ...soldResponses,
      ...rejectResponses,
      ...propertyResponses,
      ...blogResponses,
      ...categoryResponses,
      ...faqResponsesFormatted,
      ...footerResponses,
      ...propertyCategoryResponses,
      ...recentUsersResponses,
    ];

    const sortedResponses = allResponses.sort(
      (a, b) => b.updatedAt - a.updatedAt
    );

    const paginatedResponses = limit
      ? sortedResponses.slice(skip, skip + limit)
      : sortedResponses;

    res.status(200).json({
      status: 200,
      message: "Analytics",
      totalCounts: sortedResponses.length,
      response: paginatedResponses,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.sellerAnalytics = async (req, res) => {
  try {
    let userId = req.user?._id;
    if (!userId) {
      return res.status(401).send({ error: "Unauthorized" });
    }

    // Fetch properties posted by the logged-in user
    const userProperties = await Property.find({ postedBy: userId });
    const userPropertyIds = userProperties.map((property) =>
      property._id.toString()
    );
    const propertyTitleMap = new Map(
      userProperties.map((property) => [
        property._id.toString(),
        property.propertyTitle,
      ])
    );

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 30);

    // Fetch approved properties
    const approvedProperties = await Property.find({
      postedBy: userId,
      propertyApproval: "Resolved",
      updatedAt: { $gte: sevenDaysAgo },
    })
      .select("propertyTitle createdAt updatedAt editBy")
      .sort({ updatedAt: -1, createdAt: -1 });

    const approvedResponses = await Promise.all(
      approvedProperties.map(async (property) => {
        let editedByDetails = "Unknown";
        if (property.editBy) {
          if (property.editBy.equals(req.user._id)) {
            editedByDetails = "you";
          } else {
            const user = await User.findById(property.editBy);
            if (user) {
              editedByDetails = "Team Farmland";
            } else {
              const seller = await Seller.findById(property.editBy);
              if (seller) {
                editedByDetails = "admin"
              }
            }
          }
        }
        const action = "Approved";
        const title = property.propertyTitle;
        const fullName = editedByDetails;
        const updatedAt = property.updatedAt.toISOString();

        return {
          type: "Property Approved",
          //message: `Your Property ${title} was ${action} by ${fullName}`,
          entity: `${title}`,
          message: `Property Approved`,
          userName: `${fullName}`,
          time: `last updated at ${updatedAt}`,
          updatedAt: property.updatedAt,
        };
      })
    );

    // Fetch archived properties
    const archivedProperties = await Property.find({
      postedBy: userId,
      isDeleted: true,
      updatedAt: { $gte: sevenDaysAgo },
    })
      .select("propertyTitle createdAt updatedAt editBy")
      .sort({ updatedAt: -1, createdAt: -1 });

    const archiveResponses = await Promise.all(
      archivedProperties.map(async (property) => {
        let editedByDetails = "Unknown";
        if (property.editBy) {
          if (property.editBy.equals(req.user._id)) {
            editedByDetails = "you";
          } else {
            const user = await User.findById(property.editBy);
            if (user) {
              editedByDetails = "Team Farmland";
            } else {
              const seller = await Seller.findById(property.editBy);
              if (seller) {
                editedByDetails = "admin";
              }
            }
          }
        }
        const action = "moved to archive";
        const title = property.propertyTitle;
        const fullName = editedByDetails;
        const updatedAt = property.updatedAt.toISOString();

        return {
          type: "Moved To Archive",
          //message: `Your Property ${title} was ${action} by ${fullName}`,
          entity: `${title}`,
          message: `Property Moved to Archive`,
          userName: `${fullName}`,
          time: `last updated at ${updatedAt}`,
          updatedAt: property.updatedAt,
        };
      })
    );

    // Fetch sold-out properties
    const soldProperties = await Property.find({
      postedBy: userId,
      propertyStatus: "sold-out",
      updatedAt: { $gte: sevenDaysAgo },
    })
      .select("propertyTitle createdAt updatedAt editBy")
      .sort({ updatedAt: -1, createdAt: -1 });

    const soldResponses = await Promise.all(
      soldProperties.map(async (property) => {
        let editedByDetails = "Unknown";
        if (property.editBy) {
          if (property.editBy.equals(req.user._id)) {
            editedByDetails = "you";
          } else {
            const user = await User.findById(property.editBy);
            if (user) {
              editedByDetails = "Team Farmland";
            } else {
              const seller = await Seller.findById(property.editBy);
              if (seller) {
                editedByDetails = "admin";
              }
            }
          }
        }
        const action = "Proprty Sold-Out";
        const title = property.propertyTitle;
        const fullName = editedByDetails;
        const updatedAt = property.updatedAt.toISOString();

        return {
          type: "Sold-Out",
          //message: `Your Property ${title} was ${action} by ${fullName}`,
          entity: `${title}`,
          message: `Property Marked as Sold-Out`,
          userName: `${fullName}`,
          time: `last updated at ${updatedAt}`,
          updatedAt: property.updatedAt,
        };
      })
    );

    // Fetch reject properties
    const rejectProperties = await Property.find({
      postedBy: userId,
      propertyApproval: "Reject",
      updatedAt: { $gte: sevenDaysAgo },
    })
      .select("propertyTitle createdAt updatedAt editBy")
      .sort({ updatedAt: -1, createdAt: -1 });

    const rejectResponses = await Promise.all(
      rejectProperties.map(async (property) => {
        let editedByDetails = "Unknown";
        if (property.editBy) {
          if (property.editBy.equals(req.user._id)) {
            editedByDetails = "you";
          } else {
            const user = await User.findById(property.editBy);
            if (user) {
              editedByDetails = "Team Farmland";
            } else {
              const seller = await Seller.findById(property.editBy);
              if (seller) {
                editedByDetails = "admin";
              }
            }
          }
        }
        const action = "Rejected";
        const title = property.propertyTitle;
        const fullName = editedByDetails;
        const updatedAt = property.updatedAt.toISOString();

        return {
          type: "Property Rejected",
          //message: `Your Property ${title} was ${action} by ${fullName}`,
          entity: `${title}`,
          message: `Property Rejected`,
          userName: `${fullName}`,
          time: `last updated at ${updatedAt}`,
          updatedAt: property.updatedAt,
        };
      })
    );

    // Fetch recent inquiries matching the user's properties
    const recentInquiries = await Inquiry.find({
      propertyId: { $in: userPropertyIds },
      createdAt: { $gte: sevenDaysAgo },
    })
      .select("buyerName createdAt updatedAt propertyId")
      .sort({ updatedAt: -1, createdAt: -1 });

    const formattedInquiries = await Promise.all(
      recentInquiries.map(async (inquiry) => {
        const propertyTitle =
          propertyTitleMap.get(inquiry.propertyId.toString()) ||
          "Unknown Property";
        const action = "raised";
        const updatedAt = inquiry.updatedAt.toISOString();
        const buyerName = inquiry.buyerName || "Unknown Buyer";

        return {
          type: "Inquiry Raised",
          //message: `Inquiry for property ${propertyTitle} by ${buyerName} was ${action}`,
          entity: `${propertyTitle}`,
          message: `New Inquiry Raised`,
          userName: `${buyerName}`,
          time: `last updated at ${updatedAt}`,
          updatedAt: inquiry.updatedAt,
        };
      })
    );

    // fetch recently visited requests
    const recentlyVisitedRequests = await Saved.find({
      properties: { $in: userPropertyIds },
      updatedAt: { $gte: sevenDaysAgo },
    })
      .select("properties savedTime savedBy updatedAt")
      .sort({ updatedAt: -1, savedTime: -1 });

    const formattedVistedRequests = await Promise.all(
      recentlyVisitedRequests.map(async (request) => {
        const propertyTitle =
          propertyTitleMap.get(request.properties.toString()) ||
          "Unknown Property";
        const action = "Schduled";
        const updatedAt = request.updatedAt.toISOString();
        const savedBy = await Seller.findById(request.savedBy).select(
          "fullName"
        );

        return {
          type: "Visit Request",
          //message: `A visit request for property ${propertyTitle} by ${savedBy.fullName} was ${action}`,
          entity: `${propertyTitle}`,
          message: `New Visit Request`,
          userName: `${savedBy.fullName}`,
          time: `last updated at ${updatedAt}`,
          updatedAt: updatedAt || new Date(),
        };
      })
    );

    //fetch recent messages
    const recentMessages = await Message.find({
      propertyId: { $in: userPropertyIds },
      updatedAt: { $gte: sevenDaysAgo },
    })
      .select("senderId propertyId message updatedAt createdAt")
      .sort({ updatedAt: -1, createdAt: -1 });

    const formattedMessages = await Promise.all(
      recentMessages.map(async (message) => {
        const propertyTitle =
          propertyTitleMap.get(message.propertyId.toString()) ||
          "Unknown Property";
        const action = "Recieved";
        const updatedAt = message.updatedAt.toISOString();
        const senderName = await Seller.findById(message.senderId).select(
          "fullName"
        );
        return {
          type: "message",
          // message: `Message from ${senderName.fullName} for property ${propertyTitle} was ${action}`,
          entity: `${propertyTitle}`,
          message: `Message Recieved`,
          userName: `${senderName.fullName}`,
          time: `last updated at ${updatedAt}`,
          updatedAt: updatedAt || new Date(),
        };
      })
    );

    const combinedResponses = [
      ...approvedResponses,
      ...archiveResponses,
      ...soldResponses,
      ...rejectResponses,
      ...formattedInquiries,
      ...formattedVistedRequests,
      ...formattedMessages,
    ].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

    // Limit to latest 20
    // const formattedResponse = combinedResponses.slice(0, 40);

    return res.status(200).send({
      status: 200,
      message: "Seller Analytics",
      response: combinedResponses,
    });
  } catch (error) {
    console.log("Error:", error);
    return res.status(500).send({ error: "Something broke" });
  }
};

exports.getPropertyAddBy = async (req, res) => {
  try {
    const propertyCounts = await Property.aggregate([
      {
        $group: {
          _id: "$addBy",
          count: { $sum: 1 },
        },
      },
    ]);

    let developersCount = 0;
    let adminCount = 0;
    let userPropertyCounts = []; // Array to store the final output

    for (const property of propertyCounts) {
      const seller = await Seller.findOne({ _id: property._id });
      const user = await User.findOne({ _id: property._id });

      if (seller) {
        if (seller.interested === "sell") {
          developersCount += property.count;
        } else if (seller.interested === "admin") {
          adminCount += property.count;
        }
      } else if (user) {
        userPropertyCounts.push([user.username, property.count]);
      }
    }

    // Add developers and admin counts to the array
    userPropertyCounts.push(["developers", developersCount]);
    userPropertyCounts.push(["admin", adminCount]);

    return res.status(200).send({ data: userPropertyCounts });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ error: "Something broke" });
  }
};

// exports.SubscriptionAnalytics = async (req, res) => {
//   try {
//     const { period, startDate, endDate } = req.query;
//     let dateFilter = null;
//     let days = 7; // Default to the last 7 days if no filter is chosen
//     const maxWeeks = 12; // Limit to 12 weeks for breakdown
//     const maxMonths = 6; // Limit to 6 months for breakdown
//     let customStartDate, customEndDate;

//     const now = new Date();

//     if (period) {
//       if (period === "7") days = 7;
//       else if (period === "15") days = 15;
//       else if (period === "30") days = 30;

//       if (days > 0) {
//         const calculatedStartDate = new Date();
//         calculatedStartDate.setDate(calculatedStartDate.getDate() - days);
//         dateFilter = { $gte: calculatedStartDate };
//       }
//     }

//     if (period === "custom" && startDate && endDate) {
//       customStartDate = new Date(startDate);
//       customEndDate = new Date(endDate);
//       customEndDate.setHours(23, 59, 59, 999);

//       if (!isNaN(customStartDate) && !isNaN(customEndDate)) {
//         dateFilter = { $gte: customStartDate, $lte: customEndDate };

//         const daysBetween = Math.ceil((customEndDate - customStartDate) / (1000 * 60 * 60 * 24));
//         days = daysBetween;

//         if (days >= 90) {
//           const months = Math.ceil(daysBetween / 30);
//           days = months * 30;
//         } else if (days >= 30) {
//           days = Math.min(daysBetween, maxWeeks * 7);
//         }
//       }
//     }

//     if (!period && !startDate && !endDate) {
//       const defaultStartDate = new Date(now.setDate(now.getDate() - days + 1));
//       dateFilter = { $gte: defaultStartDate };
//       days = 7;
//     }

//     const searchQuery = dateFilter ? { createdAt: dateFilter } : {};

//     const silverPlans = await Subscription.find({ plan: "Silver", ...searchQuery });
//     const goldPlans = await Subscription.find({ plan: "Gold", ...searchQuery });
//     const platinumPlans = await Subscription.find({ plan: "Platinum", ...searchQuery });

//     const silverPrice = silverPlans.reduce((sum, plan) => sum + parseInt(plan.price), 0);
//     const goldPrice = goldPlans.reduce((sum, plan) => sum + parseInt(plan.price), 0);
//     const platinumPrice = platinumPlans.reduce((sum, plan) => sum + parseInt(plan.price), 0);
//     const totalPrice = silverPrice + goldPrice + platinumPrice;

//     const getWeekNumber = (date, startOfRange) => {
//       const start = new Date(startOfRange);
//       start.setDate(start.getDate() - (start.getDay() || 7) + 1);
//       const days = Math.floor((date - start) / (24 * 60 * 60 * 1000));
//       return Math.floor(days / 7) + 1;
//     };

//     const getWeekName = (weekNumber) => `week${weekNumber}`;
//     const getDayName = (dayNumber) => `day${dayNumber}`;
//     const getMonthName = (monthNumber) => `month${monthNumber}`;

//     const calculateBreakdownPeriods = (startDate, endDate, useDays = false, useMonths = false) => {
//       const periods = {};
//       let currentDate = new Date(startDate);
//       let periodCount = 1;

//       while (currentDate <= endDate) {
//         if (useDays) {
//           const dayKey = getDayName(periodCount);
//           periods[dayKey] = 0;
//         } else if (useMonths) {
//           const monthKey = getMonthName(periodCount);
//           periods[monthKey] = 0;
//         } else {
//           const weekStart = new Date(currentDate);
//           weekStart.setDate(weekStart.getDate() - (weekStart.getDay() || 7) + 1);
//           const weekNumber = getWeekNumber(weekStart, startDate);
//           const weekKey = getWeekName(weekNumber);
//           if (!periods[weekKey]) {
//             periods[weekKey] = 0;
//           }
//         }
//         if (useMonths) {
//           currentDate.setMonth(currentDate.getMonth() + 1);
//         } else {
//           currentDate.setDate(currentDate.getDate() + 1);
//         }
//         periodCount++;
//       }
//       return periods;
//     };

//     const useDaysForBreakdown = days <= 28;
//     const useMonthsForBreakdown = days >= 90;

//     const breakdownStartDate = customStartDate || new Date(now.setDate(now.getDate() - days + 1));
//     const breakdownEndDate = customEndDate || new Date();
//     const breakdownPeriods = calculateBreakdownPeriods(breakdownStartDate, breakdownEndDate, useDaysForBreakdown, useMonthsForBreakdown);

//     const calculateBreakdown = (plans, breakdownPeriods, useDays = false, useMonths = false) => {
//       const breakdown = { ...breakdownPeriods };
//       plans.forEach(plan => {
//         const periodStart = new Date(plan.createdAt);
//         if (useDays) {
//           const dayNumber = Math.ceil((periodStart - breakdownStartDate) / (1000 * 60 * 60 * 24)) + 1;
//           if (dayNumber >= 1 && dayNumber <= days) {
//             const dayKey = getDayName(dayNumber);
//             breakdown[dayKey] = (breakdown[dayKey] || 0) + parseInt(plan.price);
//           }
//         } else if (useMonths) {
//           const monthNumber = periodStart.getMonth() - breakdownStartDate.getMonth() + 1;
//           const monthKey = getMonthName(monthNumber);
//           breakdown[monthKey] = (breakdown[monthKey] || 0) + parseInt(plan.price);
//         } else {
//           periodStart.setDate(periodStart.getDate() - (periodStart.getDay() || 7) + 1);
//           const weekNumber = getWeekNumber(periodStart, breakdownStartDate);
//           const weekKey = getWeekName(weekNumber);
//           if (breakdown[weekKey] !== undefined) {
//             breakdown[weekKey] += parseInt(plan.price);
//           }
//         }
//       });
//       return breakdown;
//     };

//     const silverBreakdown = calculateBreakdown(silverPlans, breakdownPeriods, useDaysForBreakdown, useMonthsForBreakdown);
//     const goldBreakdown = calculateBreakdown(goldPlans, breakdownPeriods, useDaysForBreakdown, useMonthsForBreakdown);
//     const platinumBreakdown = calculateBreakdown(platinumPlans, breakdownPeriods, useDaysForBreakdown, useMonthsForBreakdown);

//     const limitBreakdown = (breakdown) => {
//       const limitedBreakdown = {};
//       const periods = Object.keys(breakdown);
//       const limit = useMonthsForBreakdown ? maxMonths : maxWeeks;
//       for (let i = 0; i < Math.min(periods.length, limit); i++) {
//         limitedBreakdown[periods[i]] = breakdown[periods[i]];
//       }
//       return limitedBreakdown;
//     };

//     const silverPriceBreakdown = useDaysForBreakdown || useMonthsForBreakdown ? silverBreakdown : limitBreakdown(silverBreakdown);
//     const goldPriceBreakdown = useDaysForBreakdown || useMonthsForBreakdown ? goldBreakdown : limitBreakdown(goldBreakdown);
//     const platinumPriceBreakdown = useDaysForBreakdown || useMonthsForBreakdown ? platinumBreakdown : limitBreakdown(platinumBreakdown);

//     const calculateTotalBreakdownPrice = (breakdown) => {
//       return Object.values(breakdown).reduce((total, value) => total + value, 0);
//     };

//     const silverBreakdownTotal = calculateTotalBreakdownPrice(silverPriceBreakdown);
//     const goldBreakdownTotal = calculateTotalBreakdownPrice(goldPriceBreakdown);
//     const platinumBreakdownTotal = calculateTotalBreakdownPrice(platinumPriceBreakdown);

//     let TotalPrice = silverBreakdownTotal + goldBreakdownTotal + platinumBreakdownTotal;

//     return res.status(200).send({
//       silverPrice: {
//         // total: silverPrice,
//         breakdown: silverPriceBreakdown,
//         breakdownTotal: silverBreakdownTotal
//       },
//       goldPrice: {
//         // total: goldPrice,
//         breakdown: goldPriceBreakdown,
//         breakdownTotal: goldBreakdownTotal
//       },
//       platinumPrice: {
//         // total: platinumPrice,
//         breakdown: platinumPriceBreakdown,
//         breakdownTotal: platinumBreakdownTotal
//       },
//       totalPrice: TotalPrice
//     });
//   } catch (error) {
//     console.log(error);
//     return res.status(500).send({ error: error.message });
//   }
// };

exports.SubscriptionAnalytics = async (req, res) => {
  try {
    const { period, startDate, endDate } = req.query;
    let dateFilter = {};
    let days = 7; // Default to the last 7 days if no filter is chosen
    const maxWeeks = 12; // Limit to 12 weeks for breakdown
    const maxMonths = 6; // Limit to 6 months for breakdown
    let customStartDate, customEndDate;

    const now = new Date();

    if (period) {
      if (period === "7") days = 7;
      else if (period === "15") days = 15;
      else if (period === "30") days = 30;

      if (days > 0) {
        const calculatedStartDate = new Date();
        calculatedStartDate.setDate(calculatedStartDate.getDate() - days);
        dateFilter = { $gte: calculatedStartDate };
      }
    }

    if (period === "custom" && startDate && endDate) {
      customStartDate = new Date(startDate);
      customEndDate = new Date(endDate);
      customEndDate.setHours(23, 59, 59, 999);

      if (!isNaN(customStartDate) && !isNaN(customEndDate)) {
        dateFilter.$gte = customStartDate;
        dateFilter.$lte = customEndDate;

        const daysBetween = Math.ceil((customEndDate - customStartDate) / (1000 * 60 * 60 * 24));
        days = daysBetween;

        if (days >= 90) {
          const months = Math.ceil(daysBetween / 30);
          days = months * 30;
        } else if (days >= 30) {
          days = Math.min(daysBetween, maxWeeks * 7);
        }
      }
    }

    if (!period && !startDate && !endDate) {
      const defaultStartDate = new Date(now.setDate(now.getDate() - days + 1));
      dateFilter.$gte = defaultStartDate;
      days = 7;
    }

    if (!dateFilter.$gte) {
      return res.status(400).json({ message: "Invalid date filter." });
    }

    const previousDateFilter = { $lt: new Date(dateFilter.$gte), $gte: new Date(dateFilter.$gte) };
    previousDateFilter.$gte.setDate(previousDateFilter.$gte.getDate() - days);

    const searchQuery = dateFilter ? { createdAt: dateFilter } : {};
    const previousSearchQuery = previousDateFilter ? { createdAt: previousDateFilter } : {};

    const silverPlans = await Subscription.find({ plan: "Silver", ...searchQuery });
    const goldPlans = await Subscription.find({ plan: "Gold", ...searchQuery });
    const platinumPlans = await Subscription.find({ plan: "Platinum", ...searchQuery });

    const previousSilverPlans = await Subscription.find({ plan: "Silver", ...previousSearchQuery });
    const previousGoldPlans = await Subscription.find({ plan: "Gold", ...previousSearchQuery });
    const previousPlatinumPlans = await Subscription.find({ plan: "Platinum", ...previousSearchQuery });

    const calculatePrice = (plans) => {
      return plans.reduce((sum, plan) => sum + parseInt(plan.price), 0);
    };

    const silverPrice = calculatePrice(silverPlans);
    const goldPrice = calculatePrice(goldPlans);
    const platinumPrice = calculatePrice(platinumPlans);
    const totalPrice = silverPrice + goldPrice + platinumPrice;

    const previousSilverPrice = calculatePrice(previousSilverPlans);
    const previousGoldPrice = calculatePrice(previousGoldPlans);
    const previousPlatinumPrice = calculatePrice(previousPlatinumPlans);
    const previousTotalPrice = previousSilverPrice + previousGoldPrice + previousPlatinumPrice;

    const getWeekNumber = (date, startOfRange) => {
      const start = new Date(startOfRange);
      start.setDate(start.getDate() - (start.getDay() || 7) + 1);
      const days = Math.floor((date - start) / (24 * 60 * 60 * 1000));
      return Math.floor(days / 7) + 1;
    };

    const getWeekName = (weekNumber) => `week${weekNumber}`;
    const getDayName = (dayNumber) => `day${dayNumber}`;
    const getMonthName = (monthNumber) => `month${monthNumber}`;

    const calculateBreakdownPeriods = (startDate, endDate, useDays = false, useMonths = false) => {
      const periods = {};
      let currentDate = new Date(startDate);
      let periodCount = 1;

      while (currentDate <= endDate) {
        if (useDays) {
          const dayKey = getDayName(periodCount);
          periods[dayKey] = 0;
        } else if (useMonths) {
          const monthKey = getMonthName(periodCount);
          periods[monthKey] = 0;
        } else {
          const weekStart = new Date(currentDate);
          weekStart.setDate(weekStart.getDate() - (weekStart.getDay() || 7) + 1);
          const weekNumber = getWeekNumber(weekStart, startDate);
          const weekKey = getWeekName(weekNumber);
          if (!periods[weekKey]) {
            periods[weekKey] = 0;
          }
        }
        if (useMonths) {
          currentDate.setMonth(currentDate.getMonth() + 1);
        } else {
          currentDate.setDate(currentDate.getDate() + 1);
        }
        periodCount++;
      }
      return periods;
    };

    const useDaysForBreakdown = days <= 28;
    const useMonthsForBreakdown = days >= 90;

    const breakdownStartDate = customStartDate || new Date(now.setDate(now.getDate() - days + 1));
    const breakdownEndDate = customEndDate || new Date();
    const breakdownPeriods = calculateBreakdownPeriods(breakdownStartDate, breakdownEndDate, useDaysForBreakdown, useMonthsForBreakdown);

    const previousBreakdownStartDate = new Date(breakdownStartDate);
    previousBreakdownStartDate.setDate(previousBreakdownStartDate.getDate() - days);
    const previousBreakdownEndDate = new Date(breakdownStartDate);
    const previousBreakdownPeriods = calculateBreakdownPeriods(previousBreakdownStartDate, previousBreakdownEndDate, useDaysForBreakdown, useMonthsForBreakdown);

    const calculateBreakdown = (plans, breakdownPeriods, breakdownStartDate, useDays = false, useMonths = false) => {
      const breakdown = { ...breakdownPeriods };
      plans.forEach(plan => {
        const periodStart = new Date(plan.createdAt);
        if (useDays) {
                    const dayNumber = Math.ceil((periodStart - breakdownStartDate) / (1000 * 60 * 60 * 24)) + 1;
                    if (dayNumber >= 1 && dayNumber <= days) {
                      const dayKey = getDayName(dayNumber);
                      breakdown[dayKey] = (breakdown[dayKey] || 0) + parseInt(plan.price);
                    }
        } else if (useMonths) {
          const monthNumber = periodStart.getMonth() - breakdownStartDate.getMonth() + 1;
          const monthKey = getMonthName(monthNumber);
          breakdown[monthKey] = (breakdown[monthKey] || 0) + parseInt(plan.price);
        } else {
          periodStart.setDate(periodStart.getDate() - (periodStart.getDay() || 7) + 1);
          const weekNumber = getWeekNumber(periodStart, breakdownStartDate);
          const weekKey = getWeekName(weekNumber);
          if (breakdown[weekKey] !== undefined) {
            breakdown[weekKey] += parseInt(plan.price);
          }
        }
      });
      return breakdown;
    };

    const silverBreakdown = calculateBreakdown(silverPlans, breakdownPeriods, breakdownStartDate, useDaysForBreakdown, useMonthsForBreakdown);
    const goldBreakdown = calculateBreakdown(goldPlans, breakdownPeriods, breakdownStartDate, useDaysForBreakdown, useMonthsForBreakdown);
    const platinumBreakdown = calculateBreakdown(platinumPlans, breakdownPeriods, breakdownStartDate, useDaysForBreakdown, useMonthsForBreakdown);

    const previousSilverBreakdown = calculateBreakdown(previousSilverPlans, previousBreakdownPeriods, previousBreakdownStartDate, useDaysForBreakdown, useMonthsForBreakdown);
    const previousGoldBreakdown = calculateBreakdown(previousGoldPlans, previousBreakdownPeriods, previousBreakdownStartDate, useDaysForBreakdown, useMonthsForBreakdown);
    const previousPlatinumBreakdown = calculateBreakdown(previousPlatinumPlans, previousBreakdownPeriods, previousBreakdownStartDate, useDaysForBreakdown, useMonthsForBreakdown);

    const limitBreakdown = (breakdown) => {
      const limitedBreakdown = {};
      const periods = Object.keys(breakdown);
      // const limit = useMonthsForBreakdown ? maxMonths : maxWeeks;
      const limit = useMonthsForBreakdown ? maxMonths : (useDaysForBreakdown ? 28 : maxWeeks);
      for (let i = 0; i < Math.min(periods.length, limit); i++) {
        const periodKey = periods[i];
        limitedBreakdown[periodKey] = breakdown[periodKey];
      }
      return limitedBreakdown;
    };

    const limitedSilverBreakdown = limitBreakdown(silverBreakdown);
    const limitedGoldBreakdown = limitBreakdown(goldBreakdown);
    const limitedPlatinumBreakdown = limitBreakdown(platinumBreakdown);

    const limitedPreviousSilverBreakdown = limitBreakdown(previousSilverBreakdown);
    const limitedPreviousGoldBreakdown = limitBreakdown(previousGoldBreakdown);
    const limitedPreviousPlatinumBreakdown = limitBreakdown(previousPlatinumBreakdown);

        const calculateTotalBreakdownPrice = (breakdown) => {
      return Object.values(breakdown).reduce((total, value) => total + value, 0);
    };

    const silverBreakdownTotal = calculateTotalBreakdownPrice(silverBreakdown);
    const goldBreakdownTotal = calculateTotalBreakdownPrice(goldBreakdown);
    const platinumBreakdownTotal = calculateTotalBreakdownPrice(platinumBreakdown);

    const previoussilverBreakdownTotal = calculateTotalBreakdownPrice(previousSilverBreakdown);
    const previousgoldBreakdownTotal = calculateTotalBreakdownPrice(previousGoldBreakdown);
    const previousplatinumBreakdownTotal = calculateTotalBreakdownPrice(previousPlatinumBreakdown);


    const response = {
      currentBreakdown : {
        totalPrice,
        silverPrice: {
                  // total: silverPrice,
                  breakdown: silverBreakdown,
                  breakdownTotal: silverBreakdownTotal
                },
                goldPrice: {
                  // total: goldPrice,
                  breakdown: goldBreakdown,
                  breakdownTotal: goldBreakdownTotal
                },
                platinumPrice: {
                  // total: silverPrice,
                  breakdown: platinumBreakdown,
                  breakdownTotal: platinumBreakdownTotal
                },
      },
      previousBreakdown: {
        previousTotalPrice,
        previousSilverPrice: {
          // total: silverPrice,
          breakdown: previousSilverBreakdown,
          breakdownTotal: previoussilverBreakdownTotal
        },
        previousGoldPrice: {
          // total: silverPrice,
          breakdown: previousGoldBreakdown,
          breakdownTotal: previousgoldBreakdownTotal
        },
        previousPlatinumPrice: {
          // total: silverPrice,
          breakdown: previousPlatinumBreakdown,
          breakdownTotal: previousplatinumBreakdownTotal
        },
      },
    };

    res.json(response);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error." });
  }
};
