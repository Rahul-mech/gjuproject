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
