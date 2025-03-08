const express = require("express");
const app = express();
const port = process.env.PORT || 3000;

// Serve static files (your HTML, CSS, JS)
app.use(express.static("public")); // Make sure your files are inside a "public" folder

app.get("/", (req, res) => {
    res.sendFile(__dirname + "/index.html"); // Adjust this if needed
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

