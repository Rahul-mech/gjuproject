const ws = new WebSocket("wss://gjuproject.onrender.com"); // WebSocket connection

let localStream;
let peerConnection;
const config = {
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
};

document.getElementById("startCall").addEventListener("click", async function () {
    try {
        localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        document.getElementById("localVideo").srcObject = localStream;

        peerConnection = new RTCPeerConnection(config);
        localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

        peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                ws.send(JSON.stringify({ type: "ice", candidate: event.candidate }));
                console.log("Sending ICE candidate:", event.candidate);
            }
        };

        peerConnection.ontrack = (event) => {
            console.log("Received remote stream:", event.streams[0]);
            document.getElementById("remoteVideo").srcObject = event.streams[0];
        };

        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        console.log("Sending offer:", offer);
        ws.send(JSON.stringify({ type: "offer", offer }));

    } catch (error) {
        console.error("Error accessing camera or microphone:", error);
        alert("Please allow access to your camera and microphone to start the call.");
    }
});

ws.onmessage = async (message) => {
    console.log("Received message:", message.data);
    const data = JSON.parse(message.data);

    if (data.type === "offer") {
        peerConnection = new RTCPeerConnection(config);
        localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

        peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                ws.send(JSON.stringify({ type: "ice", candidate: event.candidate }));
                console.log("Sending ICE candidate:", event.candidate);
            }
        };

        peerConnection.ontrack = (event) => {
            console.log("Received remote stream:", event.streams[0]);
            document.getElementById("remoteVideo").srcObject = event.streams[0];
        };

        await peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer));
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        console.log("Sending answer:", answer);
        ws.send(JSON.stringify({ type: "answer", answer }));
    }

    if (data.type === "answer") {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
    }

    if (data.type === "ice" && peerConnection) {
        await peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
        console.log("Adding ICE candidate:", data.candidate);
    }
};

document.getElementById("endCall").addEventListener("click", function () {
    if (peerConnection) {
        peerConnection.close();
    }
    localStream.getTracks().forEach(track => track.stop());
    document.getElementById(
