const socket = io(); // Connect to the Socket.IO server

const localVideo = document.getElementById('local-video');
const remoteVideo = document.getElementById('remote-video');
const startButton = document.getElementById('start-button');
const stopButton = document.getElementById('stop-button');
const nextButton = document.getElementById('next-button');
const statusText = document.getElementById('status');

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

    // Update status
    updateStatus('Waiting for a match...');
  } catch (error) {
    console.error('Error accessing media devices:', error);
    updateStatus('Failed to access media devices.');
  }
});

// Stop video chat
stopButton.addEventListener('click', () => {
  resetUI();
  socket.emit('leave-queue');
  socket.emit('end-chat');
});

// Next user
nextButton.addEventListener('click', () => {
  resetUI();
  socket.emit('leave-queue');
  socket.emit('next-user');
});

// Handle WebRTC signaling
socket.on('chat-started', (otherUserId) => {
  updateStatus('Call in progress...');
  createPeerConnection(otherUserId);
});

socket.on('offer', ({ offer, from }) => {
  if (!peerConnection) {
    console.error('PeerConnection not initialized');
    return;
  }
  peerConnection.setRemoteDescription(new RTCSessionDescription(offer))
    .then(() => peerConnection.createAnswer())
    .then(answer => peerConnection.setLocalDescription(answer))
    .then(() => socket.emit('answer', { to: from, answer: peerConnection.localDescription }))
    .catch(error => console.error('Error handling offer:', error));
});

socket.on('answer', ({ answer }) => {
  if (!peerConnection) {
    console.error('PeerConnection not initialized');
    return;
  }
  peerConnection.setRemoteDescription(new RTCSessionDescription(answer))
    .catch(error => console.error('Error handling answer:', error));
});

socket.on('ice-candidate', ({ candidate, from }) => {
  if (!peerConnection) {
    console.error('PeerConnection not initialized');
    return;
  }
  peerConnection.addIceCandidate(new RTCIceCandidate(candidate))
    .catch(error => console.error('Error adding ICE candidate:', error));
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
    .then(() => socket.emit('offer', { to: otherUserId, offer: peerConnection.localDescription }))
    .catch(error => console.error('Error creating offer:', error));
}

// Reset UI and cleanup resources
function resetUI() {
  if (localStream) {
    localStream.getTracks().forEach(track => track.stop());
    localStream = null;
  }
  if (peerConnection) {
    peerConnection.close();
    peerConnection = null;
  }
  remoteVideo.srcObject = null;
  stopButton.disabled = true;
  nextButton.disabled = true;
  updateStatus('Call ended. Click "Start Video Chat" to begin again.');
}

// Update status text
function updateStatus(message) {
  statusText.textContent = message;
}
