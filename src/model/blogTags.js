const { default: mongoose, Schema } = require("mongoose");

const tagsSchema = new Schema({
  admin : {
    type : mongoose.Schema.Types.ObjectId,
    ref: "sellers"
  },
  tags: {
    type: String,
    required: true,
  },
},
{
  timestamps: true
}
);

const Tags = mongoose.model("tags", tagsSchema);
module.exports = Tags;
