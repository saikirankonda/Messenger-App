const User = require("../models/authModel");
const messageModel = require("../models/messageModel");
const formidable = require("formidable");
const fs = require("fs");

const getLastMessage = async (myId, fdId) => {
  const msg = await messageModel
    .findOne({
      $or: [
        {
          $and: [
            {
              senderId: {
                $eq: myId,
              },
            },
            {
              receiverId: {
                $eq: fdId,
              },
            },
          ],
        },
        {
          $and: [
            {
              senderId: {
                $eq: fdId,
              },
            },
            {
              receiverId: {
                $eq: myId,
              },
            },
          ],
        },
      ],
    })
    .sort({ updatedAt: -1 });
  return msg;
};

module.exports.getFriends = async (req, res) => {
  const myId = req.myId;
  let fnd_msg = [];
  try {
    const friendGet = await User.find({
      _id: {
        $ne: myId,
      },
    });
    for (let i = 0; i < friendGet.length; i++) {
      let lmsg = await getLastMessage(myId, friendGet[i].id);
      fnd_msg = [...fnd_msg, { fndInfo: friendGet[i], msgInfo: lmsg }];
      // console.log(fnd_msg);
    }
    // const filter = friendGet.filter((d) => d.id !== myId);
    res.status(200).json({ success: true, friends: fnd_msg });
  } catch (e) {
    res.status(500).json({
      error: {
        errorMessage: "Internal Server Error",
      },
    });
  }
};

module.exports.messageUploadToDB = async (req, res) => {
  const { senderName, receiverId, message } = req.body;
  const senderId = req.myId;

  try {
    const insertMessage = await messageModel.create({
      senderId,
      senderName,
      receiverId,
      message: { text: message, image: "" },
    });
    res.status(200).json({ success: true, message: insertMessage });
  } catch (e) {
    res.status(500).json({
      error: {
        errorMessage: "Internal Server Error",
      },
    });
  }
};

module.exports.messageGet = async (req, res) => {
  const myId = req.myId;
  const fdId = req.params.id;

  try {
    let getAllMessages = await messageModel.find({
      $or: [
        {
          $and: [
            {
              senderId: {
                $eq: myId,
              },
            },
            {
              receiverId: {
                $eq: fdId,
              },
            },
          ],
        },
        {
          $and: [
            {
              senderId: {
                $eq: fdId,
              },
            },
            {
              receiverId: {
                $eq: myId,
              },
            },
          ],
        },
      ],
    });
    // getAllMessages = getAllMessages.filter(
    //   (each) =>
    //     (each.senderId === myId && each.receiverId === fdId) ||
    //     (each.receiverId === myId && each.senderId == fdId)
    // );
    res.status(200).json({ success: true, message: getAllMessages });
  } catch (e) {
    res.status(500).json({
      error: {
        errorMessage: "Internal Server Error",
      },
    });
  }
};

module.exports.ImageMessageSend = async (req, res) => {
  const senderId = req.myId;
  const form = formidable();
  form.parse(req, (err, fields, files) => {
    const { senderName, receiverId, imageName } = fields;
    const newPath = __dirname + `../../../frontend/public/image/${imageName}`;
    files.image.originalFilename = imageName;

    try {
      fs.copyFile(files.image.filepath, newPath, async (err) => {
        if (err) {
          res.status(500).json({
            error: {
              errorMessage: "Image upload failed",
            },
          });
        } else {
          const insertMessage = await messageModel.create({
            senderId,
            senderName,
            receiverId,
            message: { text: "", image: files.image.originalFilename },
          });
          res.status(200).json({ success: true, message: insertMessage });
        }
      });
    } catch (e) {
      res.status(500).json({
        error: {
          errorMesage: "Internal Server Error",
        },
      });
    }
  });
};

module.exports.messageSeen = async (req, res) => {
  const messageId = req.body._id;
  await messageModel
    .findByIdAndUpdate(messageId, { status: "seen" })
    .then(() => {
      res.status(200).json({ success: true });
    })
    .catch((err) => {
      res.status(500).json({
        error: {
          errorMessage: "Internal Server Error",
        },
      });
    });
};

module.exports.deliveredMessage = async (req, res) => {
  const messageId = req.body._id;
  await messageModel
    .findByIdAndUpdate(messageId, { status: "delivered" })
    .then(() => {
      res.status(200).json({ success: true });
    })
    .catch((err) => {
      res.status(500).json({
        error: {
          errorMessage: "Internal Server Error",
        },
      });
    });
};
