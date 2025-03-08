const ws = new WebSocket("wss://gjuproject.onrender.com"); // WebSocket connection

let localStream;
let peerConnection;
const config = {
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
};

document.getElementById("startCall").addEventListener("click", async function () {
    try {
        // Get audio-only stream
        localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        console.log("Microphone access granted!");

        peerConnection = new RTCPeerConnection(config);
        localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

        peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                ws.send(JSON.stringify({ type: "ice", candidate: event.candidate }));
            }
        };

        peerConnection.ontrack = (event) => {
            const remoteAudio = document.getElementById("remoteAudio");
            remoteAudio.srcObject = event.streams[0];
            remoteAudio.play();
        };

        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        ws.send(JSON.stringify({ type: "offer", offer }));

    } catch (error) {
        console.error("Error accessing microphone:", error);
        alert("Please allow microphone access to start the call.");
    }
});

ws.onmessage = async (message) => {
    const data = JSON.parse(message.data);

    if (data.type === "offer") {
        peerConnection = new RTCPeerConnection(config);
        localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

        peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                ws.send(JSON.stringify({ type: "ice", candidate: event.candidate }));
            }
        };

        peerConnection.ontrack = (event) => {
            const remoteAudio = document.getElementById("remoteAudio");
            remoteAudio.srcObject = event.streams[0];
            remoteAudio.play();
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
};

document.getElementById("endCall").addEventListener("click", function () {
    if (peerConnection) {
        peerConnection.close();
    }
    localStream.getTracks().forEach(track => track.stop());
    alert("Call ended.");
});
