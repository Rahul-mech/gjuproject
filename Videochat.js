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
    console.log('Requesting camera and microphone access...');
    localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    console.log('Camera and microphone access granted.');
    localVideo.srcObject = localStream;
    startButton.disabled = true;
    stopButton.disabled = false;
  } catch (error) {
    console.error('Error accessing media devices:', error);
  }
}

// Create a new RTCPeerConnection
function createPeerConnection() {
  console.log('Creating peer connection...');
  peerConnection = new RTCPeerConnection(configuration);

  // Add local stream to peer connection
  localStream.getTracks().forEach(track => {
    console.log('Adding track:', track.kind);
    peerConnection.addTrack(track, localStream);
  });

  // Handle remote stream
  peerConnection.ontrack = (event) => {
    console.log('Received remote stream.');
    remoteVideo.srcObject = event.streams[0];
    remoteStream = event.streams[0];
  };

  // Handle ICE candidates
  peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
      console.log('Sending ICE candidate...');
      socket.emit('ice-candidate', event.candidate);
    }
  };
}

// Start video chat
startButton.addEventListener('click', async () => {
  console.log('Start button clicked.');
  await startLocalStream();
  createPeerConnection();
  socket.emit('request-video-chat'); // Request a random match
});

// Handle incoming messages from the server
socket.on('chat-started', async (otherUserId) => {
  console.log('Chat started with:', otherUserId);
  // Create an offer
  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);

  // Send the offer to the other user
  socket.emit('offer', { to: otherUserId, offer });
});

// Handle incoming offer
socket.on('offer', async ({ offer }) => {
  console.log('Received offer.');
  await peerConnection.setRemoteDescription(offer);

  // Create an answer
  const answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);

  // Send the answer to the other user
  socket.emit('answer', { to: socket.id, answer });
});

// Handle incoming answer
socket.on('answer', async ({ answer }) => {
  console.log('Received answer.');
  await peerConnection.setRemoteDescription(answer);
});

// Handle incoming ICE candidate
socket.on('ice-candidate', async (candidate) => {
  console.log('Received ICE candidate.');
  await peerConnection.addIceCandidate(candidate);
});

// Stop video chat
stopButton.addEventListener('click', () => {
  console.log('Stop button clicked.');
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
