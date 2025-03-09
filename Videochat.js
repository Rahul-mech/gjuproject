const socket = new WebSocket("wss://your-websocket-server.com"); // Change this to your actual WebSocket server URL

let localStream;
let peerConnection;
let remoteUser = null;

const config = {
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
};

// Get video elements
const localVideo = document.getElementById("localVideo");
const remoteVideo = document.getElementById("remoteVideo");

// Start Call Button
document.getElementById("startCall").addEventListener("click", async function () {
    console.log("Searching for a match...");

    localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    localVideo.srcObject = localStream;

    peerConnection = new RTCPeerConnection(config);
    localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

    peerConnection.onicecandidate = (event) => {
        if (event.candidate && remoteUser) {
            socket.send(JSON.stringify({ type: "ice", candidate: event.candidate, to: remoteUser }));
        }
    };

    peerConnection.ontrack = (event) => {
        remoteVideo.srcObject = event.streams[0];
    };

    socket.send(JSON.stringify({ type: "findMatch" }));
});

// Handle WebSocket Messages
socket.onmessage = async (message) => {
    const data = JSON.parse(message.data);

    if (data.type === "matchFound") {
        remoteUser = data.partnerId;
        console.log("Matched with: ", remoteUser);

        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        socket.send(JSON.stringify({ type: "offer", offer, to: remoteUser }));
    }

    if (data.type === "offer") {
        remoteUser = data.from;
        await peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer));

        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        socket.send(JSON.stringify({ type: "answer", answer, to: remoteUser }));
    }

    if (data.type === "answer") {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
    }

    if (data.type === "ice" && data.from === remoteUser) {
        await peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
    }
};

// End Call Button
document.getElementById("endCall").addEventListener("click", function () {
    if (peerConnection) {
        peerConnection.close();
    }
    if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
    }
    localVideo.srcObject = null;
    remoteVideo.srcObject = null;
    remoteUser = null;
    alert("Call ended.");
    socket.send(JSON.stringify({ type: "endCall" }));
});
