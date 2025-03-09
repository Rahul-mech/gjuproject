const express = require('express');
   const http = require('http');
   const { Server } = require('socket.io');

   const app = express();
   const server = http.createServer(app);
   const io = new Server(server);

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

       // When a user disconnects
       socket.on('disconnect', () => {
           console.log('A user disconnected:', socket.id);
           waitingUsers = waitingUsers.filter(user => user !== socket.id);
       });
   });

   // Start the server
   const PORT = 3000;
   server.listen(PORT, () => {
       console.log(`Server is running on http://localhost:${PORT}`);
   });
