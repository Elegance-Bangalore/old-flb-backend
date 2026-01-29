#!/usr/bin/env node
/**
 * Rails-like console: connect to MongoDB and expose all models in a REPL.
 * Usage: node console.js   or   npm run console
 *
 * Examples:
 *   await City.find({})
 *   await Country.find({})
 *   await State.find({})
 *   await User.find({}).limit(5)
 *   await Property.findOne({ propertyCode: 'ABC123' })
 *
 * Mongoose returns Promises; use await in the REPL (Node 18+ has top-level await).
 * Ensure .env has DB set (MongoDB URI). Exit with .exit or Ctrl+D.
 */

require("dotenv").config({ path: "./.env" });
const repl = require("repl");
const connectDB = require("./src/config/db");

// Load all models (same names as in src/model/)
const City = require("./src/model/city.model");
const Country = require("./src/model/country.model");
const State = require("./src/model/state.model");
const User = require("./src/model/users.model");
const Seller = require("./src/model/seller.model");
const Property = require("./src/model/property.model");
const Enquiry = require("./src/model/enquiry.model");
const Order = require("./src/model/order.model");
const Conversation = require("./src/model/conversation.model");
const Message = require("./src/model/message.model");
const Coupon = require("./src/model/coupon.model");
const Campaign = require("./src/model/campaign.js");
const CampaignDownload = require("./src/model/campaignDownload.model");
const SellerSub = require("./src/model/sellerSub.model");
const Saved = require("./src/model/buyerSaved"); // "saved" collection
const VisitRequest = require("./src/model/savedProperties"); // visitRequests
const BookingSlot = require("./src/model/bookingSlot.model");
const PropertyCategory = require("./src/model/propertyCategory.model");
const mongoose = require("mongoose");

async function run() {
  await connectDB();

  const replServer = repl.start("> ");
  const context = replServer.context;

  // Expose models (Rails-like names)
  context.City = City;
  context.Country = Country;
  context.State = State;
  context.User = User;
  context.Seller = Seller;
  context.Property = Property;
  context.Enquiry = Enquiry;
  context.Order = Order;
  context.Conversation = Conversation;
  context.Message = Message;
  context.Coupon = Coupon;
  context.Campaign = Campaign;
  context.CampaignDownload = CampaignDownload;
  context.SellerSub = SellerSub;
  context.Saved = Saved;
  context.VisitRequest = VisitRequest;
  context.BookingSlot = BookingSlot;
  context.PropertyCategory = PropertyCategory;
  context.mongoose = mongoose;

  // Helper: all(Model) -> fetch all docs (Rails-like)
  context.all = async (Model) => {
    const name = Model.modelName || "Model";
    const docs = await Model.find({}).lean();
    console.log(`${name}.find({}) => ${docs.length} document(s)`);
    return docs;
  };

  // Helper: count
  context.count = async (Model) => {
    const n = await Model.countDocuments({});
    console.log(n);
    return n;
  };

  replServer.on("exit", () => {
    mongoose.connection.close();
    process.exit(0);
  });

  console.log("Models loaded: City, Country, State, User, Seller, Property, Enquiry, Order, Conversation, Message, Coupon, Campaign, CampaignDownload, SellerSub, Saved, VisitRequest, BookingSlot, PropertyCategory");
  console.log("Helpers: all(Model), count(Model). Use await: await City.find({}), await all(Country)");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
