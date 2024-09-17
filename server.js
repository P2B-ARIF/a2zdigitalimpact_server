const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();
const connectDB = require("./config/db");

// Import routers
const auth = require("./routers/auth");
const service = require("./routers/services");
const controller = require("./routers/controller");
const testimonial = require("./routers/testimonial");
const project = require("./routers/projects");
const blogs = require("./routers/blogs");

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database connection
connectDB();

// Routers
app.use("/auth", auth);
app.use("/services", service);
app.use("/controller", controller);
app.use("/testimonial", testimonial);
app.use("/project", project);
app.use("/blogs", blogs);

// Serve uploaded images statically
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Basic route for checking server status
app.get("/", (req, res) => {
	res.status(200).json({ message: "Hello from server" });
});

// Centralized error handling middleware
app.use((err, req, res, next) => {
	console.error("Server Error:", err.message);
	res.status(500).json({ message: "Internal Server Error", error: err.message });
});

// Server listening
app.listen(port, () => {
	console.log(`Server is running on port http://localhost:${port}`);
});
