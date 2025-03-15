const PRE = "DELTA";
const SUF = "MEET";
var peer;
var local_stream;
var currentPeer = null;
var waitingPeer = null; // Store the waiting user globally

var getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

function startRandomChat() {
    console.log("Searching for a random partner...");
    hideModal();

    // Create a new peer with a random ID
    peer = new Peer();
    peer.on('open', (id) => {
        console.log("Connected with ID: ", id);
        getUserMedia({ video: true, audio: true }, (stream) => {
            local_stream = stream;
            setLocalStream(local_stream);

            if (waitingPeer) {
                console.log("Pairing with: " + waitingPeer);
                let call = peer.call(waitingPeer, stream);
                call.on('stream', (stream) => {
                    setRemoteStream(stream);
                });
                currentPeer = call;
                waitingPeer = null; // Remove the waiting user
            } else {
                console.log("Waiting for a partner...");
                waitingPeer = id; // Store this user as waiting
            }
        }, (err) => {
            console.log(err);
        });
    });

    peer.on('call', (call) => {
        call.answer(local_stream);
        call.on('stream', (stream) => {
            setRemoteStream(stream);
        });
        currentPeer = call;
        waitingPeer = null; // Reset waitingPeer when paired
    });
}

function setLocalStream(stream) {
    let video = document.getElementById("local-video");
    video.srcObject = stream;
    video.muted = true;
    video.play();
}

function setRemoteStream(stream) {
    let video = document.getElementById("remote-video");
    video.srcObject = stream;
    video.play();
}

function hideModal() {
    document.getElementById("entry-modal").hidden = true;
}
