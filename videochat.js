document.getElementById("startCall").addEventListener("click", async function () {
    try {
        // Request permission for both camera and microphone
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        console.log("Camera and microphone access granted:", stream);

        // Show local video stream
        const localVideo = document.getElementById("localVideo");
        localVideo.srcObject = stream;
        localVideo.play(); // Ensure video starts playing

    } catch (error) {
        console.error("Error accessing camera or microphone:", error);
        alert("Please allow access to your camera and microphone to start the call.");
    }
});

document.getElementById("endCall").addEventListener("click", function () {
    console.log("Call ended.");
    alert("Call ended.");

    // Stop the video stream
    const localVideo = document.getElementById("localVideo");
    if (localVideo.srcObject) {
        localVideo.srcObject.getTracks().forEach(track => track.stop());
        localVideo.srcObject = null;
    }
});
