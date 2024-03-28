const io = require("socket.io")(8000, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

let users = [];
const addUser = (userId, socketId, userInfo) => {
  const checkUser = users.some((each) => each.userId === userId);
  if (!checkUser) {
    users.push({ userId, socketId, userInfo });
  }
};

const userRemove = (socketId) => {
  users = users.filter((u) => u.socketId !== socketId);
};

//finding the active friend from friend list : to get the status of the message whether it delivered or not
const findFriend = (id) => {
  return users.find((u) => u.userId === id);
};

const userLogout = (userId) => {
  users = users.filter((u) => u.userId !== userId);
};

io.on("connection", (socket) => {
  console.log("Socket is connecting ...");
  socket.on("addUser", (userId, userInfo) => {
    // console.log(userId, userInfo);
    // received or got this data from frontend
    addUser(userId, socket.id, userInfo);
    // passing this to the function to create data to send to backend
    io.emit("getUser", users);
    //sending or emitting command to frontend to get the user information
    //new user add- update the friend list automatically
    const us = users.filter((u) => u.userId !== userId);
    const con = "new_user_add";
    for (var i = 0; i < us.length; i++) {
      socket.to(us[i].socketId).emit("new_user_add", con);
    }
  });
  //recieving the each message data
  socket.on("sendMessage", (data) => {
    const user = findFriend(data.receiverId); //finding active or not
    // console.log(data);
    if (user !== undefined) {
      socket.to(user.socketId).emit("getMessage", data);
    }
  });
  //seen Message update to the socket
  socket.on("messageSeen", (msg) => {
    const user = findFriend(msg.senderId);
    if (user !== undefined) {
      socket.to(user.socketId).emit("msgSeenResponse", msg);
    }
  });
  //delivered message update to the socket
  socket.on("deliveredMessage", (msg) => {
    const user = findFriend(msg.senderId);
    if (user !== undefined) {
      socket.to(user.socketId).emit("msgDeliveredResponse", msg);
    }
  });
  socket.on("seen", (data) => {
    const user = findFriend(data.senderId);
    if (user !== undefined) {
      socket.to(user.socketId).emit("seenSuccess", data);
    }
  });
  //recieving the message 'typing message' from frontend
  socket.on("typingMessage", (data) => {
    const user = findFriend(data.receiverId);
    if (user !== undefined) {
      //sending to the frontend in fast way
      socket.to(user.socketId).emit("typingMessageGet", {
        senderId: data.senderId,
        receiverId: data.receiverId,
        msg: data.msg,
      });
    }
  });
  //logging out from the socket to update the non online users in the friends list
  socket.on("logout", (userId) => {
    userLogout(userId);
  });
  //disconnecting the inactive users from the list with this inbuilt method : disconnect
  socket.on("disconnect", () => {
    console.log("user disconnected");
    userRemove(socket.id); //removed the user on disconnect
    io.emit("getUser", users); //sending users info to the frontend
  });
});
