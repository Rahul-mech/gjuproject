const express = require("express");
const http = require("http");
const WebSocket = require("ws");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Store connected clients
let clients = [];

wss.on("connection", (ws) => {
    console.log("New client connected!");
    clients.push(ws);

    // Once two users are connected, pair them
    if (clients.length === 2) {
        const [user1, user2] = clients;

        // Send 'pairing' message to both users
        user1.send(JSON.stringify({ type: "pairing", partner: 2 }));
        user2.send(JSON.stringify({ type: "pairing", partner: 1 }));
    }

    ws.on("message", (message) => {
        console.log("Received message:", message);
        const data = JSON.parse(message);

        if (data.type === "offer" || data.type === "answer" || data.type === "ice") {
            // Send the message to the other user
            clients.forEach((client, index) => {
                if (index !== clients.indexOf(ws)) {
                    client.send(message);
                }
            });
        }
    });

    ws.on("close", () => {
        console.log("Client disconnected.");
        clients = clients.filter(client => client !== ws); // Remove client from the list
    });
});

// Serve static files (your HTML, CSS, JS)
app.use(express.static(__dirname));

const PORT = process.env.PORT || 10000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
