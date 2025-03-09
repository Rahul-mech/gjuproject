const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve static files (frontend)
app.use(express.static(path.join(__dirname, 'public')));

// Add a root route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Store users waiting for a match
let waitingUsers = [];

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // When a user requests a video chat
  socket.on('request-video-chat', () => {
    waitingUsers.push(socket.id);

    // If there are at least 2 users waiting, pair them
    if (waitingUsers.length >= 2) {
      const user1 = waitingUsers.shift();
      const user2 = waitingUsers.shift();

      // Notify both users to start the chat
      io.to(user1).emit('chat-started', user2);
      io.to(user2).emit('chat-started', user1);
    }
  });

  // Handle WebRTC signaling (offer, answer, ICE candidates)
  socket.on('offer', ({ to, offer }) => {
    io.to(to).emit('offer', { offer, from: socket.id });
  });

  socket.on('answer', ({ to, answer }) => {
    io.to(to).emit('answer', { answer, from: socket.id });
  });

  socket.on('ice-candidate', ({ to, candidate }) => {
    io.to(to).emit('ice-candidate', { candidate, from: socket.id });
  });

  // When a user disconnects
  socket.on('disconnect', () => {
    console.log('A user disconnected:', socket.id);
    waitingUsers = waitingUsers.filter(user => user !== socket.id);
  });
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
