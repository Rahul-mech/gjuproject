const socket = io();

socket.on("match-found", () => {
    console.log("Match found! Connecting...");
});

socket.on("partner-disconnected", () => {
    alert("Your partner disconnected. Finding a new match...");
    location.reload();
});
