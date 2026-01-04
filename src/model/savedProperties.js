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

const visitSchema = new Schema({
  requestAccepted: {
    type: Boolean,
    default: false,
  },
  savedId : {
    type: mongoose.Schema.Types.ObjectId,
  },
  requestedBy: {
    type: mongoose.Schema.Types.ObjectId,
  },
  properties: {
    type: mongoose.Schema.Types.ObjectId,
  },
  requestTime: {
    type: Date,
  },
  slot: slotSchema,
  selectDate : {
    type : Date,
  },
  notificationSentCount : {
    type : Number,
    default : 0
  }
},
  { timestamps: true });

const Requests = mongoose.model("visitRequests", visitSchema);
module.exports = Requests;
