require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const admin = require('firebase-admin');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Initialize Firebase Admin (use service account or env vars in production)
// For Render: upload service account JSON or use env vars
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: process.env.FIREBASE_PROJECT_ID,
    // credential: admin.credential.cert(...) for full security
  });
}

// Auth middleware
function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token' });
  }
  const idToken = authHeader.split('Bearer ')[1];
  admin.auth().verifyIdToken(idToken)
    .then(decodedToken => {
      req.user = decodedToken;
      next();
    })
    .catch(error => {
      console.error('Token verification error:', error);
      res.status(403).json({ error: 'Invalid token' });
    });
}

// Public routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Protected API example
app.get('/api/dashboard', verifyToken, async (req, res) => {
  try {
    const userDoc = await admin.firestore().collection('users').doc(req.user.uid).get();
    res.json({ user: req.user, profile: userDoc.data() || {} });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Socket.io with auth
const users = [];
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error('Authentication error'));
  admin.auth().verifyIdToken(token)
    .then(decoded => {
      socket.user = decoded;
      next();
    })
    .catch(() => next(new Error('Invalid token')));
});

io.on('connection', socket => {
  console.log('Authenticated user connected:', socket.user.email);

  socket.on('new-user', peerId => {
    users.push({ socketId: socket.id, peerId, user: socket.user });
  });

  socket.on('request-connection', () => {
    // ... existing logic, enhanced with user info
    const currentUser = users.find(u => u.socketId === socket.id);
    const availableUsers = users.filter(u => u.socketId !== socket.id);
    if (availableUsers.length > 0) {
      const randomPeer = availableUsers[Math.floor(Math.random() * availableUsers.length)];
      socket.emit('connect-to', randomPeer.peerId);
      io.to(randomPeer.socketId).emit('connect-to', currentUser.peerId);
    } else {
      socket.emit('no-peers');
    }
  });

  socket.on('disconnect', () => {
    const index = users.findIndex(u => u.socketId === socket.id);
    if (index !== -1) users.splice(index, 1);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT} with auth`);
});
