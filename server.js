const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Serve static files from the root (since all files are in the main branch)
app.use(express.static(__dirname));

// Serve the main HTML file when users visit "/"
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

const waitingUsers = [];
const activeChats = new Map();

io.on("connection", (socket) => {
    console.log(`User connected: ${socket.id}`);

    socket.on("request-video-chat", () => {
        waitingUsers.push(socket.id);

        if (waitingUsers.length >= 2) {
            const user1 = waitingUsers.shift();
            const user2 = waitingUsers.shift();

            activeChats.set(user1, user2);
            activeChats.set(user2, user1);

            io.to(user1).emit("chat-started", { otherUserId: user2, isInitiator: true });
            io.to(user2).emit("chat-started", { otherUserId: user1, isInitiator: false });

            console.log(`Paired users: ${user1} ↔ ${user2}`);
        }
    });

    socket.on("offer", ({ to, offer }) => {
        io.to(to).emit("offer", { offer, from: socket.id });
    });

    socket.on("answer", ({ to, answer }) => {
        io.to(to).emit("answer", { answer, from: socket.id });
    });

    socket.on("ice-candidate", ({ to, candidate }) => {
        io.to(to).emit("ice-candidate", { candidate, from: socket.id });
    });

    socket.on("end-chat", () => {
        const partner = activeChats.get(socket.id);
        if (partner) {
            io.to(partner).emit("chat-ended");
            activeChats.delete(socket.id);
            activeChats.delete(partner);
        }
    });

    socket.on("next-user", () => {
        const partner = activeChats.get(socket.id);
        if (partner) {
            io.to(partner).emit("chat-ended");
            activeChats.delete(socket.id);
            activeChats.delete(partner);

            waitingUsers.push(socket.id);
            waitingUsers.push(partner);
        }
    });

    socket.on("disconnect", () => {
        console.log(`User disconnected: ${socket.id}`);

        const index = waitingUsers.indexOf(socket.id);
        if (index !== -1) {
            waitingUsers.splice(index, 1);
        }

        const partner = activeChats.get(socket.id);
        if (partner) {
            io.to(partner).emit("chat-ended");
            activeChats.delete(partner);
        }
        activeChats.delete(socket.id);
    });
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`🔥 Server running on port ${PORT}`));
