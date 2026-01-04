const { default: mongoose, Schema } = require("mongoose");

const slotSchema = new Schema({
  slot: {
    type: String,
    required: true
  },
  available: {
    type: Boolean,
    default: true
  }
});

const SavedProperties = new Schema({
  saved: {
    type: Boolean,
    default: false,
  },
  visitRequest: {
    type: Boolean,
    default: false,
  },
  accepted: {
    type: Boolean,
    default: false,
  },
  savedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref : "sellers"
  },
  properties: {
    type: mongoose.Schema.Types.ObjectId,
    ref : "properties"
  },
  savedTime: {
    type: Date,
  },
  selectDate : {
    type : Date,
  },
  slot: slotSchema,
},
{
  timestamps: true}
);

const Saved = mongoose.model("saved", SavedProperties);
module.exports = Saved;
