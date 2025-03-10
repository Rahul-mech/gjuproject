async function getICEServers() {
    try {
        let response = await fetch("https://global.xirsys.net/_turn/MyFirstApp", {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ format: "urls" }),
            credentials: "include"
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

    const peerConnection = new RTCPeerConnection({
        iceServers: iceServers
    });

    // Set up event listeners for ICE candidates
    peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
            console.log("New ICE candidate:", event.candidate);
        }
    };

    // Handle video/audio stream
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then(stream => {
            document.getElementById("localVideo").srcObject = stream;
            stream.getTracks().forEach(track => peerConnection.addTrack(track, stream));
        })
        .catch(error => console.error("Error accessing media devices:", error));

    return peerConnection;
}

// Start WebRTC when the page loads
startWebRTC();
