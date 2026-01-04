const { model, Schema } = require("mongoose");
const resetSchema = new Schema({
  email: String,
  resetToken: String,
  expiresAt: Number,
});

module.exports = model("resettokens", resetSchema);
