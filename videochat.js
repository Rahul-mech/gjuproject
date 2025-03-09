const socket = io(); // Connect to the Socket.IO server

const localVideo = document.getElementById('local-video');
const remoteVideo = document.getElementById('remote-video');
const startButton = document.getElementById('start-button');
const stopButton = document.getElementById('stop-button');
const nextButton = document.getElementById('next-button');

let localStream;
let peerConnection;

// Start video chat
startButton.addEventListener('click', async () => {
  try {
    // Capture local media stream
    localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    localVideo.srcObject = localStream;

    // Request a video chat
    socket.emit('request-video-chat');

    // Enable the stop and next buttons
    stopButton.disabled = false;
    nextButton.disabled = false;
  } catch (error) {
    console.error('Error accessing media devices:', error);
  }
});

// Stop video chat
stopButton.addEventListener('click', () => {
  if (localStream) {
    localStream.getTracks().forEach(track => track.stop());
  }
  if (peerConnection) {
    peerConnection.close();
  }
  socket.emit('end-chat');
  stopButton.disabled = true;
  nextButton.disabled = true;
});

// Next user
nextButton.addEventListener('click', () => {
  if (peerConnection) {
    peerConnection.close(); // Close the current connection
  }
  if (localStream) {
    localStream.getTracks().forEach(track => track.stop()); // Stop local stream
  }
  socket.emit('next-user'); // Notify the server to re-queue the user
  nextButton.disabled = true;
});

// Handle WebRTC signaling
socket.on('chat-started', (otherUserId) => {
  createPeerConnection(otherUserId);
});

socket.on('offer', ({ offer, from }) => {
  peerConnection.setRemoteDescription(new RTCSessionDescription(offer))
    .then(() => peerConnection.createAnswer())
    .then(answer => peerConnection.setLocalDescription(answer))
    .then(() => socket.emit('answer', { to: from, answer: peerConnection.localDescription }));
});

socket.on('answer', ({ answer }) => {
  peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
});

socket.on('ice-candidate', ({ candidate, from }) => {
  peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
});

// Create a peer connection
function createPeerConnection(otherUserId) {
  const configuration = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };
  peerConnection = new RTCPeerConnection(configuration);

  // Add local stream tracks to the peer connection
  localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

  // Handle remote stream
  peerConnection.ontrack = (event) => {
    remoteVideo.srcObject = event.streams[0];
  };

  // Handle ICE candidates
  peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
      socket.emit('ice-candidate', { to: otherUserId, candidate: event.candidate });
    }
  };

  // Create an offer
  peerConnection.createOffer()
    .then(offer => peerConnection.setLocalDescription(offer))
    .then(() => socket.emit('offer', { to: otherUserId, offer: peerConnection.localDescription }));
}
