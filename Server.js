const express = require("express");
const http = require("http");
const socketIo = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

let waitingUser = null;

io.on("connection", (socket) => {
    if (waitingUser) {
        // Pair the new user with the waiting user
        socket.partner = waitingUser;
        waitingUser.partner = socket;

        socket.emit("match-found");
        waitingUser.emit("match-found");

        waitingUser = null;
    } else {
        // No one is waiting, so this user waits
        waitingUser = socket;
    }

    socket.on("disconnect", () => {
        if (socket.partner) {
            socket.partner.emit("partner-disconnected");
            socket.partner.partner = null;
        }
        if (waitingUser === socket) {
            waitingUser = null;
        }
    });
});

server.listen(3000, () => {
    console.log("Server running on port 3000");
});
