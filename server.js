const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Serve static files (if needed)
app.use(express.static(path.join(__dirname, 'public')));

const waitingUsers = []; // Queue of users waiting for a chat partner
const activeChats = new Map(); // Store active chat pairs

io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    // Handle request for video chat
    socket.on('request-video-chat', () => {
        waitingUsers.push(socket.id);

        if (waitingUsers.length >= 2) {
            const user1 = waitingUsers.shift();
            const user2 = waitingUsers.shift();

            activeChats.set(user1, user2);
            activeChats.set(user2, user1);

            // Notify both users that chat has started
            io.to(user1).emit('chat-started', { otherUserId: user2, isInitiator: true });
            io.to(user2).emit('chat-started', { otherUserId: user1, isInitiator: false });

            console.log(`Paired users: ${user1} ↔ ${user2}`);
        }
    });

    // Handle WebRTC signaling
    socket.on('offer', ({ to, offer }) => {
        io.to(to).emit('offer', { offer, from: socket.id });
    });

    socket.on('answer', ({ to, answer }) => {
        io.to(to).emit('answer', { answer, from: socket.id });
    });

    socket.on('ice-candidate', ({ to, candidate }) => {
        io.to(to).emit('ice-candidate', { candidate, from: socket.id });
    });

    // Handle user ending the chat
    socket.on('end-chat', () => {
        const partner = activeChats.get(socket.id);
        if (partner) {
            io.to(partner).emit('chat-ended'); // Notify the partner
            activeChats.delete(socket.id);
            activeChats.delete(partner);
        }
    });

    // Handle "Next User" feature
    socket.on('next-user', () => {
        const partner = activeChats.get(socket.id);
        if (partner) {
            io.to(partner).emit('chat-ended'); // Notify partner
            activeChats.delete(socket.id);
            activeChats.delete(partner);

            // Re-add both users to the queue for a new match
            waitingUsers.push(socket.id);
            waitingUsers.push(partner);
        }
    });

    // Handle user disconnection
    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);

        // Remove from waiting list if disconnected
        const index = waitingUsers.indexOf(socket.id);
        if (index !== -1) {
            waitingUsers.splice(index, 1);
        }

        // Remove from active chats and notify the partner
        const partner = activeChats.get(socket.id);
        if (partner) {
            io.to(partner).emit('chat-ended');
            activeChats.delete(partner);
        }
        activeChats.delete(socket.id);
    });
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`🔥 Server running on port ${PORT}`));
