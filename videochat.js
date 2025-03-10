const socket = io(); // Connect to the server

const localVideo = document.getElementById("local-video");
const remoteVideo = document.getElementById("remote-video");
const startButton = document.getElementById("start-button");
const stopButton = document.getElementById("stop-button");

let localStream;
let peerConnection;

// Function to get ICE servers from Xirsys
async function getICEServers() {
    try {
        let response = await fetch("https://global.xirsys.net/_turn/MyFirstApp", {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Basic " + btoa("gjuproject:7c6388be-fd7b-11ef-9737-0242ac150002")
            },
            body: JSON.stringify({ format: "urls" }),
        });

        let data = await response.json();
        return data.v?.iceServers || []; // Return ICE servers or empty array if unavailable
    } catch (error) {
        console.error("Error fetching ICE servers:", error);
        return [];
    }
}

// Initialize WebRTC Connection
async function startWebRTC() {
    const iceServers = await getICEServers();

    peerConnection = new RTCPeerConnection({ iceServers });

    // Add local stream to peer connection
    localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    localVideo.srcObject = localStream;
    localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

    // Handle remote stream
    peerConnection.ontrack = (event) => {
        remoteVideo.srcObject = event.streams[0];
    };

    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
            socket.emit("ice-candidate", event.candidate);
        }
    };

    return peerConnection;
}

// Start chat on button click
startButton.addEventListener("click", async () => {
    startButton.disabled = true;
    peerConnection = await startWebRTC();
    socket.emit("request-video-chat");
});

// Stop chat
stopButton.addEventListener("click", () => {
    if (peerConnection) peerConnection.close();
    if (localStream) localStream.getTracks().forEach(track => track.stop());
    socket.emit("end-chat");
    startButton.disabled = false;
});

// Handle signaling
socket.on("offer", async (offer) => {
    peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    socket.emit("answer", answer);
});

socket.on("answer", async (answer) => {
    await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
});

socket.on("ice-candidate", async (candidate) => {
    await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
});
