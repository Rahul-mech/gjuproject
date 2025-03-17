const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve static files (like discuss.html) from the root directory
app.use(express.static(__dirname));

// Route to serve discuss.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'discuss.html'));
});

const users = []; // Store available users

io.on('connection', socket => {
    console.log('New user connected:', socket.id);

    // When a new user joins
    socket.on('new-user', peerId => {
        users.push({ socketId: socket.id, peerId });
        console.log('Current users:', users);
    });

    // When a user requests a connection
    socket.on('request-connection', () => {
        const currentUser = users.find(u => u.socketId === socket.id);
        const availableUsers = users.filter(u => u.socketId !== socket.id);

        if (availableUsers.length > 0) {
            const randomPeer = availableUsers[Math.floor(Math.random() * availableUsers.length)];
            socket.emit('connect-to', randomPeer.peerId); // Tell user to connect
            io.to(randomPeer.socketId).emit('connect-to', currentUser.peerId); // Tell peer
        } else {
            socket.emit('no-peers'); // No one available
        }
    });

    // When user disconnects
    socket.on('disconnect', () => {
        const index = users.findIndex(u => u.socketId === socket.id);
        if (index !== -1) {
            users.splice(index, 1);
            console.log('User disconnected, remaining:', users);
        }
    });
});

const PORT = process.env.PORT || 3000; // Render ka port ya default 3000
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
