const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static(__dirname));

let waitingUser = null;

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    if (waitingUser) {
        socket.emit('matchFound', waitingUser);
        waitingUser.emit('matchFound', socket);

        waitingUser = null;
    } else {
        waitingUser = socket;
    }

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        if (waitingUser === socket) {
            waitingUser = null;
        }
    });
});

server.listen(3000, () => {
    console.log('Server running on port 3000');
});
