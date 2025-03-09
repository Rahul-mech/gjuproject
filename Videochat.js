const localVideo = document.getElementById('local-video');
const remoteVideo = document.getElementById('remote-video');
const startButton = document.getElementById('start-button');
const stopButton = document.getElementById('stop-button');

let localStream;
let remoteStream;
let peerConnection;
let socket;

// Replace with your Render backend URL
const serverUrl = 'https://classmate-backend-9xqh.onrender.com';

// Initialize Socket.IO connection
socket = io(serverUrl);

// WebRTC configuration (use Google's public STUN server)
const configuration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' } // Free STUN server
  ]
};

// Get user media (video and audio)
async function startLocalStream() {
  try {
    localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    localVideo.srcObject = localStream;
    startButton.disabled = true;
    stopButton.disabled = false;
  } catch (error) {
    console.error('Error accessing media devices:', error);
  }
}

// Create a new RTCPeerConnection
function createPeerConnection() {
  peerConnection = new RTCPeerConnection(configuration);

  // Add local stream to peer connection
  localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

  // Handle remote stream
  peerConnection.ontrack = (event) => {
    remoteVideo.srcObject = event.streams[0];
    remoteStream = event.streams[0];
  };

  // Handle ICE candidates
  peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
      socket.emit('ice-candidate', event.candidate);
    }
  };
}

// Start video chat
startButton.addEventListener('click', async () => {
  await startLocalStream();
  createPeerConnection();
  socket.emit('request-video-chat'); // Request a random match
});

// Handle incoming messages from the server
socket.on('chat-started', async (otherUserId) => {
  // Create an offer
  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);

  // Send the offer to the other user
  socket.emit('offer', { to: otherUserId, offer });
});

// Handle incoming offer
socket.on('offer', async ({ offer }) => {
  await peerConnection.setRemoteDescription(offer);

  // Create an answer
  const answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);

  // Send the answer to the other user
  socket.emit('answer', { to: socket.id, answer });
});

// Handle incoming answer
socket.on('answer', async ({ answer }) => {
  await peerConnection.setRemoteDescription(answer);
});

// Handle incoming ICE candidate
socket.on('ice-candidate', async (candidate) => {
  await peerConnection.addIceCandidate(candidate);
});

// Stop video chat
stopButton.addEventListener('click', () => {
  if (localStream) {
    localStream.getTracks().forEach(track => track.stop());
  }
  if (peerConnection) {
    peerConnection.close();
  }
  localVideo.srcObject = null;
  remoteVideo.srcObject = null;
  startButton.disabled = false;
  stopButton.disabled = true;
});
