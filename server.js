const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname)));

app.get("/", (req, res) => {
    res.sendFile(__dirname + "/index.html");
});

const activeUsernames = new Set();

io.on("connection", (socket) => {
    console.log("New client connected");

    let thisUsername = "";

    socket.on("checkUsername", (name) => {
        if (activeUsernames.has(name)) {
            socket.emit("usernameStatus", false);
        } else {
            activeUsernames.add(name);
            thisUsername = name;
            socket.emit("usernameStatus", true);
        }
    });

    socket.on("disconnect", () => {
        if (thisUsername) {
            activeUsernames.delete(thisUsername);
            console.log(`${thisUsername} disconnected and removed from active usernames.`);
        }
    });

    socket.on("chatMessage", ({ room, message }) => {
        const msgId = crypto.randomUUID();

        const finalMessage = {
            id: msgId,
            username: thisUsername || "Anonymous",
            content: message
        };
    
        io.to(room).emit("message", finalMessage);
    });
    

    socket.on("joinRoom", ({ room, username }) => {
        activeUsernames.add(username);

        socket.join(room);
        socket.to(room).emit("roomjoin", `${username || "Someone"} joined room ${room}`);
    });

    socket.on("msg-del-req", ({ room, msg_id }) => {
        io.to(room).emit("messageDeleted", msg_id);
    });
});

server.listen(3000, () => {
    console.log("Server running on http://localhost:3000");
});
