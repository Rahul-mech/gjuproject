const express = require("express");
const http = require("http");
const WebSocket = require("ws");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let users = [];

wss.on("connection", (ws) => {
    console.log("New client connected!");
    users.push(ws);  // Add the user to the queue

    if (users.length === 2) {
        const user1 = users.shift(); // Get the first user
        const user2 = users.shift(); // Get the second user

        // Pair the users together by sending each other a signal
        user1.send(JSON.stringify({ type: "start_call", message: "You are paired with someone!" }));
        user2.send(JSON.stringify({ type: "start_call", message: "You are paired with someone!" }));

        // Handle the message flow between the two
        user1.on("message", (message) => {
            user2.send(message); // Send user1's message to user2
        });
        user2.on("message", (message) => {
            user1.send(message); // Send user2's message to user1
        });
    }

    ws.on("close", () => {
        console.log("Client disconnected.");
        // Clean up the user queue on disconnect
        users = users.filter((user) => user !== ws);
    });
});

// Serve static files (your HTML, CSS, JS)
app.use(express.static(__dirname));

const PORT = process.env.PORT || 10000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
