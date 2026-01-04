const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const uri = process.env.DB;
    const conn = await mongoose.connect(uri, { useNewUrlParser: true });
    console.log(`\x1b[34m MongoDb Connected: ${conn.connection.host} \x1b[0m`);
    mongoose.set("debug", false);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

module.exports = connectDB;
