const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
	{
		senderId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "sellers",
			required: true,
		},
		receiverId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "sellers",
			required: true,
		},
		propertyId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "properties",
			required: true,
		},
		message: {
			type: String,
			required: true,
		},
		isRead:{
			type: Boolean,
			default: false,
		},
		notificationSentCount: {
			type: Number,
			default: 0,
		}
		// createdAt, updatedAt
	},
	{ timestamps: true }
);

module.exports = mongoose.model("Message", messageSchema);