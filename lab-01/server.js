const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;

// Record the status after the response has been sent.
app.use((req, res, next) => {
    res.on("finish", () => {
        console.log(`${req.method} ${req.path} -> ${res.statusCode}`);
    });
    next();
});

app.get("/", (req, res) => {
    res.status(200).send("Welcome to my Node.js and Express server!");
});

app.get("/hello", (req, res) => {
    res.status(200).send("Hello");
});

app.get("/about", (req, res) => {
    res.status(200).json({ name: "Abhinav", section: "AIML_2B_207" });
});

app.get("/time", (req, res) => {
    res.status(200).json({ currentDateTime: new Date().toISOString() });
});

// Keep the fallback after all valid routes.
app.use((req, res) => {
    res.status(404).send("404 - Page not found");
});

app.listen(PORT, () => {
    console.log(`Express server running at http://localhost:${PORT}`);
});
