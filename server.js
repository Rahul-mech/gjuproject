const express = require("express");
const path = require("path");

const app = express();
const port = process.env.PORT || 10000;

// ✅ Serve all static files from the root directory
app.use(express.static(__dirname));

// ✅ Handle direct page requests
app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, req.path));
});

// ✅ Start the server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
