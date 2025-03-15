<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Video Chat</title>
    <script src="https://cdn.jsdelivr.net/npm/socket.io-client@4.4.1/dist/socket.io.min.js"></script>
    <script src="https://webrtc.github.io/adapter/adapter-latest.js"></script>
    <style>
        body {
            font-family: Arial, sans-serif;
            text-align: center;
            margin: 50px;
        }
        video {
            width: 45%;
            max-width: 600px;
            border: 2px solid #007BFF;
            border-radius: 10px;
            margin: 10px;
        }
        .chat-option {
            display: inline-block;
            padding: 15px 30px;
            margin: 20px;
            font-size: 20px;
            color: white;
            background: #007BFF;
            border: none;
            cursor: pointer;
            text-decoration: none;
            border-radius: 5px;
        }
        .chat-option:hover {
            background: #0056b3;
        }
    </style>
</head>
<body>
    <h1>Anonymous Video Chat</h1>
    <video id="localVideo" autoplay playsinline muted></video>
    <video id="remoteVideo" autoplay playsinline></video>
    <br>
    <button class="chat-option" id="startCall">Start Chat</button>
    <button class="chat-option" id="endCall">End Chat</button>
    
    <script>
        const socket = io("wss://your-signaling-server.com"); // Change to your actual signaling server
        let localStream;
        let peerConnection;
        const config = {
            iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
        };

        async function startCall() {
            localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            document.getElementById("localVideo").srcObject = localStream;
            peerConnection = new RTCPeerConnection(config);
            localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

            peerConnection.onicecandidate = event => {
                if (event.candidate) {
                    socket.emit("candidate", event.candidate);
                }
            };
            peerConnection.ontrack = event => {
                document.getElementById("remoteVideo").srcObject = event.streams[0];
            };

            const offer = await peerConnection.createOffer();
            await peerConnection.setLocalDescription(offer);
            socket.emit("offer", offer);
        }

        socket.on("offer", async offer => {
            peerConnection = new RTCPeerConnection(config);
            localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

            await peerConnection.setRemoteDescription(offer);
            const answer = await peerConnection.createAnswer();
            await peerConnection.setLocalDescription(answer);
            socket.emit("answer", answer);
        });

        socket.on("answer", answer => {
            peerConnection.setRemoteDescription(answer);
        });

        socket.on("candidate", candidate => {
            peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
        });

        document.getElementById("startCall").addEventListener("click", startCall);
        document.getElementById("endCall").addEventListener("click", () => {
            if (peerConnection) peerConnection.close();
            document.getElementById("localVideo").srcObject = null;
            document.getElementById("remoteVideo").srcObject = null;
        });
    </script>
</body>
</html>
