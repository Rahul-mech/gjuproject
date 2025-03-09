const socket = new WebSocket("wss://gjuproject.onrender.com");

socket.onopen = () => {
    console.log("Connected to WebSocket server");
};

socket.onmessage = (event) => {
    console.log("Message received:", event.data);
    const data = JSON.parse(event.data);

    if (data.type === "pairing") {
        console.log("Paired with another user.");
    }
};

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

let localStream;
let peerConnection;
let remoteVideo = document.getElementById("remoteVideo"); // This is where remote video will be shown
let localVideo = document.getElementById("localVideo"); // Local user video

const config = {
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
};

// Start Call - User clicked the "Start Call" button
document.getElementById("startCall").addEventListener("click", async function () {
    try {
        localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        localVideo.srcObject = localStream; // Show local video in the browser

        peerConnection = new RTCPeerConnection(config);
        localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

        // ICE candidate handling
        peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                ws.send(JSON.stringify({ type: "ice", candidate: event.candidate }));
            }
        };

        // When remote track is received
        peerConnection.ontrack = (event) => {
            remoteVideo.srcObject = event.streams[0]; // Show remote user's video
        };

        // Create offer for the other user
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        ws.send(JSON.stringify({ type: "offer", offer }));

    } catch (error) {
        console.error("Error accessing camera or microphone:", error);
        alert("Please allow access to your camera and microphone to start the call.");
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
    localStream.getTracks().forEach(track => track.stop());
    localVideo.srcObject = null;
    remoteVideo.srcObject = null;
    alert("Call ended.");
});
