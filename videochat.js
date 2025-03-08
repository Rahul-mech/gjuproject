const ws = new WebSocket("wss://your-server-url"); // Replace with your actual server URL

let localStream;
let peerConnection;
const config = {
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
};

document.getElementById("startCall").addEventListener("click", async function () {
    try {
        // Get local stream (audio and video)
        localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        document.getElementById("localVideo").srcObject = localStream;

        // Send signal to server that the user is ready
        ws.send(JSON.stringify({ type: "ready" }));

    } catch (error) {
        console.error("Error accessing camera or microphone:", error);
        alert("Please allow access to your camera and microphone to start the call.");
    }
});

ws.onmessage = async (message) => {
    const data = JSON.parse(message.data);

    if (data.type === "pair") {
        // Pairing logic: Once paired, create the peer connection
        console.log("Paired with user:", data.id);

        peerConnection = new RTCPeerConnection(config);
        localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

        peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                ws.send(JSON.stringify({ type: "ice", candidate: event.candidate }));
            }
        };

        peerConnection.ontrack = (event) => {
            // Display the remote user's video
            const remoteVideo = document.getElementById("remoteVideo");
            remoteVideo.srcObject = event.streams[0];
        };

        // Send the offer to the paired user
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        ws.send(JSON.stringify({ type: "offer", offer }));
    }

    if (data.type === "offer") {
        // Handle incoming offer from paired user
        peerConnection = new RTCPeerConnection(config);
        localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

        peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                ws.send(JSON.stringify({ type: "ice", candidate: event.candidate }));
            }
        };

        peerConnection.ontrack = (event) => {
            // Display the remote user's video
            const remoteVideo = document.getElementById("remoteVideo");
            remoteVideo.srcObject = event.streams[0];
        };

        await peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer));
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        ws.send(JSON.stringify({ type: "answer", answer }));
    }

    if (data.type === "answer") {
        // Handle answer from paired user
        await peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
    }

    if (data.type === "ice" && peerConnection) {
        // Handle ICE candidates
        await peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
    }
};

document.getElementById("endCall").addEventListener("click", function () {
    if (peerConnection) {
        peerConnection.close();
    }
    localStream.getTracks().forEach(track => track.stop());
    document.getElementById("localVideo").srcObject = null;
    document.getElementById("remoteVideo").srcObject = null;
    alert("Call ended.");
});
