const Conversation = require("../model/conversation.model");
const Message = require("../model/message.model");
const mongoose = require("mongoose");
const { getReceiverSocketId, io } = require("./../socket.io/socket");
const propertyModel = require("../model/property.model");
const sellerModel = require("../model/seller.model");
const sendMessageEmail = require("../utils/chatnotificationEmail");

// exports.sendMessage = async (req, res) => {
//   try {
//     const { message } = req.body;
//     const { id: receiverId, propertyId } = req.params;
//     const senderId = req.user._id;

//     const chechPropertyId = await propertyModel.findOne({ _id: propertyId });
//     if (!chechPropertyId) {
//       return res.status(400).send({ error: "Property not found" });
//     }
   
//     let conversation = await Conversation.findOne({
//       participants: { $all: [senderId, receiverId] },
//       propertyId,
//     });
//     let senderName = "",
//       receiverName = "",
//       propertyName = "";

//     propertyName = await propertyModel
//       .findOne({ _id: propertyId })
//       .select({ propertyTitle: 1, _id: 0 })
//       .lean();

//     let receiverEmail = "";

//     let seller = await sellerModel
//       .find({ _id: { $in: [senderId, receiverId] } })
//       .select({ fullName: 1, email: 1})
//       .lean();
   

//     if (seller && seller.length) {
//       if (seller.length && seller[0]._id.toString() === senderId.toString()) {
//         senderName = seller[0].fullName;
//         receiverName = seller[1].fullName;
//         receiverEmail = seller[1].email
//       } else {
//         senderName = seller[1].fullName;
//         receiverName = seller[0].fullName;
//         receiverEmail = seller[0].email
//       }
//     }
//     if (propertyName && Object.keys(propertyName).length) {
//       propertyName = propertyName.propertyTitle;
//     }
   
//     if (!conversation) {
//       conversation = await Conversation.create({
//         participants: [senderId, receiverId],
//         propertyId,
//       });
//     }

//     let newMessage = new Message({
//       senderId,
//       receiverId,
//       propertyId,
//       message,
//     });
//     if (newMessage) {
//       conversation.messages.push(newMessage._id);
//     }

//     await Promise.all([conversation.save(), newMessage.save()]);

//     newMessage = JSON.parse(JSON.stringify(newMessage));

//     newMessage["senderName"] = senderName;
//     newMessage["receiverName"] = receiverName;
//     newMessage["propertyName"] = propertyName;

//     const receiverSocketId = getReceiverSocketId(receiverId);

//     if (receiverSocketId) {
//       io.to(receiverSocketId).emit("newMessage", newMessage);
//     }else {
//       const data = {
//         newMessage: newMessage,
//         Name : receiverName
//       }
//       const sendEmail = await sendMessageEmail(receiverEmail,data,'chatnotification')
//     }

//     return res.status(201).json(newMessage);
//   } catch (e) {
//     console.log(e);
//     return res.status(500).send({ error: "Internal Server Error" });
//   }
// };

exports.sendMessage = async (req, res) => {
  try {
    const { message } = req.body;
    const { id: receiverId, propertyId } = req.params;
    const senderId = req.user._id;

    const chechPropertyId = await propertyModel.findOne({ _id: propertyId });
    if (!chechPropertyId) {
      return res.status(400).send({ error: "Property not found" });
    }
   
    let conversation = await Conversation.findOne({
      participants: { $all: [senderId, receiverId] },
      propertyId,
    });
    let senderName = "",
      receiverName = "",
      propertyName = "";

    propertyName = await propertyModel
      .findOne({ _id: propertyId })
      .select({ propertyTitle: 1, _id: 0 })
      .lean();

    let receiverEmail = "";

    let seller = await sellerModel
      .find({ _id: { $in: [senderId, receiverId] } })
      .select({ fullName: 1, email: 1, interested: 1 }) // Fetching the interested field
      .lean();
   
    let emailTemplate = 'chatnotification'; // Default template

    if (seller && seller.length) {
      if (seller.length && seller[0]._id.toString() === senderId.toString()) {
        senderName = seller[0].fullName;
        receiverName = seller[1].fullName;
        receiverEmail = seller[1].email;
        emailTemplate = seller[1].interested === 'buy' ? 'chatbuyernotification' : 'chatnotification';
      } else {
        senderName = seller[1].fullName;
        receiverName = seller[0].fullName;
        receiverEmail = seller[0].email;
        emailTemplate = seller[0].interested === 'buy' ? 'chatbuyernotification' : 'chatnotification';
      }
    }
    if (propertyName && Object.keys(propertyName).length) {
      propertyName = propertyName.propertyTitle;
    }
   
    if (!conversation) {
      conversation = await Conversation.create({
        participants: [senderId, receiverId],
        propertyId,
      });
    }

    let newMessage = new Message({
      senderId,
      receiverId,
      propertyId,
      message,
    });
    if (newMessage) {
      conversation.messages.push(newMessage._id);
    }

    await Promise.all([conversation.save(), newMessage.save()]);

    newMessage = JSON.parse(JSON.stringify(newMessage));

    newMessage["senderName"] = senderName;
    newMessage["receiverName"] = receiverName;
    newMessage["propertyName"] = propertyName;

    const receiverSocketId = getReceiverSocketId(receiverId);

    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
    } else {
      const data = {
        newMessage: newMessage,
        Name : receiverName
      }
      const sendEmail = await sendMessageEmail(receiverEmail, data, emailTemplate);
    }

    return res.status(201).json(newMessage);
  } catch (e) {
    console.log(e);
    return res.status(500).send({ error: "Internal Server Error" });
  }
};


exports.getMessages = async (req, res) => {
  try {
    let { id: senderId, propertyId } = req.params;
    let receiverId = req.user._id;

    let conversation = await Conversation.findOne({
      participants: { $all: [senderId, receiverId] },
      propertyId: propertyId,
    })
      .populate("messages")
      .populate("participants");
    let senderProfile = "",
      receiverProfile = "",
      senderName = "";
    if (!conversation) {
      return res.status(200).json([]);
    }

    const participantMap = new Map(
      conversation.participants.map((participant) => [
        participant._id.toString(),
        participant,
      ])
    );

    const formattedMessages = conversation.messages.map((message) => ({
      ...message,
      senderName: participantMap.get(message.senderId.toString()).fullName,
      senderProfile: participantMap.get(message.senderId.toString()).profilePic,
    }));

    let messageData = [];
    for (let i = 0; i < formattedMessages.length; i++) {
      messageData.push({
        _id: formattedMessages[i]._doc._id,
        senderId: formattedMessages[i]._doc.senderId,
        receiverId: formattedMessages[i]._doc.receiverId,
        propertyId: formattedMessages[i]._doc.propertyId,
        message: formattedMessages[i]._doc.message,
        isRead: formattedMessages[i]._doc.isRead,
        createdAt: formattedMessages[i]._doc.createdAt,
        updatedAt: formattedMessages[i]._doc.updatedAt,
        senderName: formattedMessages[i].senderName,
        senderProfile: formattedMessages[i].senderProfile,
      });
    }

    const output = {
      messages: messageData,
      senderProfile: conversation.participants[0].profilePic,
      receiverProfile: conversation.participants[1].profilePic,
      senderName: conversation.participants[0].fullName,
    };

    // const messages = JSON.parse(JSON.stringify(conversation.messages));

    // messages.forEach((message) => {
    //   message.senderProfile = senderProfile;
    //   message.senderName = senderName;
    // });

    return res.status(200).json(
      // messages: messages,
      // senderProfile: senderProfile,
      // receiverProfile: receiverProfile,
      // senderName: senderName,
      output
    );
  } catch (err) {
    console.log(err);
    return res.status(500).send({ error: err.message });
  }
};

exports.chats = async (req, res) => {
  try {
    console.log("chat list");
    let searchKey = req.query.search || "";
    let query = {};

    const { _id: loggedInUserId, interested } = req.user;

    let conversation = await Conversation.find({
      participants: { $in: [loggedInUserId] },
    })
      .populate("propertyId")
      .populate("participants")
      .populate("messages")
      .select({ createdAt: 0, __v: 0 });

    if (!conversation) {
      return res.status(200).json([]);
    }
    let result = [],
      data = {};
    conversation.map((con) => {
      let participants = con.participants;
      let property = con.propertyId;

      let messages = con.messages;
      let count = 0;
      participants.map((p) => {
        if (p._id.toString() === loggedInUserId) {
          data = {
            ...data,
            receiverName: p.fullName,
          };
        } else {
          data = {
            ...data,
            senderName: p.fullName,
          };
        }
        if (!interested.includes(p.interested)) {
          data = {
            ...data,

            id: p._id,
            profilePic: p.i_am === "owner" ? p.profilePic : p.logo,
          };
        }
      });

      messages.map((m) => {
        if (!m.isRead && m.receiverId == loggedInUserId) {
          count++;
        }
        data = {
          ...data,
          recentlyReceivedMessage: m.updatedAt,
        };
      });

      data = {
        ...data,
        propertyId: property?._id,
        propertyName: property?.propertyTitle,
        propertySize: property?.totalAcre
          ? property.totalAcre + "Acre"
          : Number(property?.plotLength) * Number(property?.plotBreadth) +
            property?.plotArea,
        price: property?.price,
        updatedAt: con?.updatedAt,
        unreadCount: count,
      };
      result.push(data);
    });

    if (searchKey && searchKey.length) {
      searchKey = searchKey.toLowerCase();
      result = result.filter((c) => {
        return (
          c?.senderName.toLowerCase().includes(searchKey) ||
          c?.propertyName?.toLowerCase().includes(searchKey)
        );
      });
    }
    result.sort((a, b) => {
      if (a.recentlyReceivedMessage > b.recentlyReceivedMessage) return -1;
      else return 1;
    });
    if (result.length) {
      io.emit("updatedChatList", result);
    }
    if (data) {
      if (!data.propertyId) {
        return res.status(404).send({
          error: "No property associated with the conversation or removed",
        });
      }
    }
    return res.status(200).json(result);
  } catch (error) {
    console.error(error);
    return res.status(500).send({ error: error.message });
  }
};

exports.markRead = async (req, res) => {
  try {
    const { propertyId, senderId } = req.params;
    const { _id } = req.user;
    const markMessagesAsRead = await Message.updateMany(
      { propertyId, receiverId: _id, senderId },
      { $set: { isRead: true } },
      { new: true }
    );
    if (markMessagesAsRead) {
      return res.status(200).json({ success: true });
    } else {
      return res.status(400).json({ success: false });
    }
  } catch (error) {
    return res.status(500).send({ error: error.message });
  }
};
