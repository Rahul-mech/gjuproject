const peer = new Peer(); // Create a PeerJS connection
let myStream;
let call;

async function getMediaStream() {
    try {
        myStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        document.getElementById("localVideo").srcObject = myStream;
    } catch (error) {
        console.error("Error accessing media devices:", error);
        alert("Please allow access to your camera and microphone.");
    }
}

// Start Chat Button
document.getElementById("startCall").addEventListener("click", async () => {
    await getMediaStream(); // Get camera & mic

    // Connect to signaling server and find a match
    fetch("https://random-video-signaling.onrender.com/findMatch") // Dummy API
        .then(response => response.json())
        .then(data => {
            if (data.peerId) {
                call = peer.call(data.peerId, myStream);
                call.on("stream", remoteStream => {
                    document.getElementById("remoteVideo").srcObject = remoteStream;
                });
            }
        })
        .catch(error => console.error("Error finding match:", error));
});

// Answer Incoming Call
peer.on("call", incomingCall => {
    incomingCall.answer(myStream);
    incomingCall.on("stream", remoteStream => {
        document.getElementById("remoteVideo").srcObject = remoteStream;
    });
});

// End Chat Button
document.getElementById("endCall").addEventListener("click", () => {
    if (call) call.close();
    myStream.getTracks().forEach(track => track.stop());
    document.getElementById("localVideo").srcObject = null;
    document.getElementById("remoteVideo").srcObject = null;
});
