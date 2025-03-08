const express = require("express");
const http = require("http");
const WebSocket = require("ws");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// To track waiting users and their WebSocket connections
let waitingUsers = [];

wss.on("connection", (ws) => {
    console.log("New client connected!");

    // Add the new user to the waiting list
    waitingUsers.push(ws);

    // Pair users when there are at least two users waiting
    if (waitingUsers.length >= 2) {
        const user1 = waitingUsers.shift(); // Get first user
        const user2 = waitingUsers.shift(); // Get second user

        // Send a pair message to both users
        user1.send(JSON.stringify({ type: "pair", id: user2._socket.remoteAddress }));
        user2.send(JSON.stringify({ type: "pair", id: user1._socket.remoteAddress }));

        // Relay offer/answer/ICE candidates between users
        user1.on("message", (message) => {
            user2.send(message); // Relay message from user1 to user2
        });

        user2.on("message", (message) => {
            user1.send(message); // Relay message from user2 to user1
        });
    }

    ws.on("close", () => {
        console.log("Client disconnected.");
        // Remove user from the waiting list
        waitingUsers = waitingUsers.filter(user => user !== ws);
    });
});

// Serve static files (your HTML, CSS, JS)
app.use(express.static(__dirname));

const PORT = process.env.PORT || 10000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
