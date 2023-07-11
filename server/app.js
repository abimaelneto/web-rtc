const express = require("express");
const cors = require("cors");
const app = express();

const http = require("http");
const server = http.createServer(app);

const { Server } = require("socket.io");
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5500",
    methods: ["GET", "POST"],
  },
});

const port = process.env.PORT || 3333;

const MAX_USERS_PER_ROOM = 3;

io.on("connection", (socket) => {
  console.log("a user connected");

  socket.on("create or join", (room) => {
    console.log("create or join to room", room);

    const myRoom = io.sockets.adapter.rooms.get(room) || { size: 0 };
    const numClients = myRoom.size;
    console.log(`${room}, has ${numClients} clients`);

    if (!numClients) {
      socket.join(room);
      socket.emit("created", room);
    } else if (numClients < MAX_USERS_PER_ROOM) {
      socket.join(room);
      socket.emit("joined", room);
    } else {
      socket.emit("full", room);
    }
  });

  socket.on("ready", (room) => {
    socket.broadcast.to(room).emit("ready");
  });
  socket.on("candidate", (event) => {
    console.log("candidate", event);

    socket.broadcast.to(event.room).emit("candidate", event);
  });
  socket.on("offer", (event) => {
    socket.broadcast.to(event.room).emit("offer", event.sdp);
  });
  socket.on("answer", (event) => {
    socket.broadcast.to(event.room).emit("answer", event.sdp);
  });
  socket.on("disconnect", () => {
    console.log("user disconnected");
  });
});

app.get("/", (req, res) => {
  res.json({ msg: "hello" });
});

server.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
