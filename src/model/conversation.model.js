const mongoose = require("mongoose");

const conversationSchema = new mongoose.Schema(
	{
		participants: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: "sellers",
			},
		],
        propertyId : {
            type : mongoose.Schema.Types.ObjectId,
            ref : "properties",
        },
		messages: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: "Message",
				default: [],
			},
		],
	},
	{ timestamps: true }
);

module.exports = mongoose.model("Conversation", conversationSchema);

