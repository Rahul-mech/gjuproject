// videochat.js

   const localVideo = document.getElementById('local-video');
   const remoteVideo = document.getElementById('remote-video');
   const startButton = document.getElementById('start-button');
   const stopButton = document.getElementById('stop-button');

   let localStream;
   let remoteStream;
   let socket;
   let peerConnection;

   // Replace with your server URL
   const serverUrl = 'http://localhost:3000';

   // Initialize Socket.IO connection
   socket = io(serverUrl);

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

   // Start video chat
   startButton.addEventListener('click', () => {
       startLocalStream();
       socket.emit('request-video-chat'); // Request a random match
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
