document.getElementById("startCall").addEventListener("click", async function () {
    try {
        // Request permission for microphone access
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        console.log("Microphone access granted:", stream);

        // Play back the audio to check (for testing)
        const audioElement = document.createElement("audio");
        audioElement.srcObject = stream;
        audioElement.autoplay = true;
        document.body.appendChild(audioElement);
    } catch (error) {
        console.error("Error accessing microphone:", error);
        alert("Please allow access to your microphone to start the call.");
    }
});

document.getElementById("endCall").addEventListener("click", function () {
    console.log("Call ended.");
    alert("Call ended.");
});
