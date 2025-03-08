const ws = new WebSocket("wss://gjuproject.onrender.com"); // WebSocket connection

let localStream;
let peerConnection;
const config = {
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
};

let partnerId = null; // To store the partner's id

document.getElementById("startCall").addEventListener("click", async function () {
    try {
        // Get video stream
        localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        document.getElementById("localVideo").srcObject = localStream;

        peerConnection = new RTCPeerConnection(config);
        localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

        peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                ws.send(JSON.stringify({ type: "ice", candidate: event.candidate }));
            }
        };

        peerConnection.ontrack = (event) => {
            document.getElementById("remoteVideo").srcObject = event.streams[0];
        };

        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        ws.send(JSON.stringify({ type: "offer", offer }));

    } catch (error) {
        console.error("Error accessing camera or microphone:", error);
        alert("Please allow access to your camera and microphone.");
    }
});

ws.onmessage = async (message) => {
    const data = JSON.parse(message.data);

    if (data.type === "pairing") {
        partnerId = data.partner; // Store the partner's id when paired
        alert(`You are paired with user ${partnerId}. Starting the video call.`);
    }

    if (data.type === "offer") {
        peerConnection = new RTCPeerConnection(config);
        localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

        peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                ws.send(JSON.stringify({ type: "ice", candidate: event.candidate }));
            }
        };

        peerConnection.ontrack = (event) => {
            document.getElementById("remoteVideo").srcObject = event.streams[0];
        };

        await peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer));
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        ws.send(JSON.stringify({ type: "answer", answer }));
    }

    if (data.type === "answer") {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
    }

    if (data.type === "ice" && peerConnection) {
        await peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
    }
});

document.getElementById("endCall").addEventListener("click", function () {
    if (peerConnection) {
        peerConnection.close();
    }
    localStream.getTracks().forEach(track => track.stop());
    document.getElementById("localVideo").srcObject = null;
    document.getElementById("remoteVideo").srcObject = null;
    alert("Call ended.");
});
