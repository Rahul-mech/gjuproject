const express = require("express");
const http = require("http");
const WebSocket = require("ws");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let waitingQueue = []; // Queue for users waiting for calls

wss.on("connection", (ws) => {
    console.log("New client connected!");

    // Add user to waiting queue
    waitingQueue.push(ws);

    // If two users are in the queue, pair them and start the video call
    if (waitingQueue.length >= 2) {
        const user1 = waitingQueue.pop();
        const user2 = waitingQueue.pop();

        // Establish communication between the two users
        setupPeerConnection(user1, user2);
        setupPeerConnection(user2, user1);
    }

    ws.on("message", (message) => {
        console.log("Received message:", message);
        // Broadcast the message to the other peer
        ws.send(message);
    });

    ws.on("close", () => {
        console.log("Client disconnected.");
        // Clean up on disconnect
        waitingQueue = waitingQueue.filter(client => client !== ws);
    });
});

function setupPeerConnection(client1, client2) {
    client1.on("message", async (message) => {
        const data = JSON.parse(message);

        // Send offer to the other client
        if (data.type === "offer") {
            await client2.send(JSON.stringify(data)); // Forward the offer to client2
        }

        // Send answer back to the first client
        if (data.type === "answer") {
            await client1.send(JSON.stringify(data)); // Forward the answer to client1
        }

        // Handle ICE candidates
        if (data.type === "ice") {
            await client2.send(JSON.stringify(data)); // Forward ICE candidates
        }
    });
}

// Serve static files (your HTML, CSS, JS)
app.use(express.static(__dirname));

const PORT = process.env.PORT || 10000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
