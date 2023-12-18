// General Imports
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const dotenv = require("dotenv");
const http = require("http");

/**/
const { Server } = require("socket.io");

// DOTENV CONFIG
dotenv.config();

// Application Module Import
const sequelize = require("./utils/database");
const app = express();
const server = http.createServer(app); // Create an HTTP server for Socket.IO

// All Middleware
app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: false }));

// Registering Routers
const routers = [
  require("./routers/userRouter"),
  require("./routers/messageRouter"),
  require("./routers/friendsRouter"),
  require("./routers/groupRouter"),
  // require("./routers/password"),
];

for (const router of routers) {
  /* code iterates over an array of routers and registers 
  each router using app.use(router). This modular approach 
  helps organize routes for different functionalities.*/
  app.use(router);
}

// Socket.IO logic
const io = new Server(server);

io.on("connection", (socket) => {
  console.log("A user connected");

  /*Socket.IO is used for real-time bidirectional communication 
  between the server and clients. It enables features like chat 
  functionality through events such as "chat message" and "disconnect."*/
  socket.on("chat message", (msg) => {
    console.log(`Received message: ${msg}`);

    // Broadcast the message to all connected clients
    /*chat message' event is triggered when a client sends a chat message.
     The server broadcasts this message to all connected clients using io.emit.
      The 'disconnect' event is triggered when a user disconnects,
       allowing the server to handle cleanup or other necessary actions.*/
    io.emit("chat message", msg);
  });

  /*disconnect event is triggered when a user disconnects from the Socket.IO server.
   It provides an opportunity for the server to perform cleanup or other actions
    related to the disconnected user.*/
  socket.on("disconnect", () => {
    console.log("A user disconnected");
  });
});

/*Sequelize is used for Object-Relational Mapping (ORM) to interact with a relational database.
 The sequelize.sync() method synchronizes the database schema with the defined models.*/
sequelize
  .sync()
  .then(() => {
    server.listen(3000, () => {
      console.log("Express server is running on port 3000");
    });
  })
  .catch((err) => {
    console.log(err);
  });

module.exports = app;
