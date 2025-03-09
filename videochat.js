const ws = new WebSocket("wss://gjuproject.onrender.com"); // WebSocket connection

// Log WebSocket events for debugging
ws.onopen = function () {
    console.log("WebSocket connection established.");
};

ws.onerror = function (error) {
    console.log("WebSocket error: ", error);
};

ws.onclose = function () {
    console.log("WebSocket connection closed.");
};

// Get video elements
let localVideo = document.getElementById("localVideo");
let remoteVideo = document.getElementById("remoteVideo");

let localStream;
let peerConnection;

const config = {
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
};

// Start Call - User clicked the "Start Call" button
document.getElementById("startCall").addEventListener("click", async function () {
    console.log("Start Call button clicked");
    try {
        // Request camera and microphone permissions
        localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        console.log("Camera and microphone access granted");

        // Display local video
        localVideo.srcObject = localStream;

        // Create WebRTC peer connection
        peerConnection = new RTCPeerConnection(config);
        localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

        peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                console.log("Sending ICE candidate:", event.candidate);
                ws.send(JSON.stringify({ type: "ice", candidate: event.candidate }));
            }
        };

        peerConnection.ontrack = (event) => {
            console.log("Received remote track");
            remoteVideo.srcObject = event.streams[0];
        };

        // Create offer and send to the WebSocket server
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        console.log("Sending offer:", offer);
        ws.send(JSON.stringify({ type: "offer", offer }));

    } catch (error) {
        console.error("Error accessing camera or microphone:", error);
        alert("Please allow access to your camera and microphone.");
    }
});

// Handle incoming WebSocket messages (for answering, ICE candidates)
ws.onmessage = async (message) => {
    const data = JSON.parse(message.data);
    console.log("Received message: ", data);

    if (data.type === "offer") {
        // When another user sends an offer
        peerConnection = new RTCPeerConnection(config);
        localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

        peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                ws.send(JSON.stringify({ type: "ice", candidate: event.candidate }));
            }
        };

        peerConnection.ontrack = (event) => {
            remoteVideo.srcObject = event.streams[0]; // Show the other user's video
        };

        // Set the remote offer and send an answer
        await peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer));
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        ws.send(JSON.stringify({ type: "answer", answer }));
    }

    if (data.type === "answer") {
        // When the answer from the other user is received
        await peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
    }

    if (data.type === "ice" && peerConnection) {
        // When ICE candidates are received, add them to the peer connection
        await peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
    }
});

// End Call - User clicked the "End Call" button
document.getElementById("endCall").addEventListener("click", function () {
    if (peerConnection) {
        peerConnection.close();
    }
    if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
    }
    localVideo.srcObject = null;
    remoteVideo.srcObject = null;
    alert("Call ended.");
});
