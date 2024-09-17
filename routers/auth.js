const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const connectDB = require("../config/db");
const nodemailer = require("nodemailer");
require("dotenv").config();

const saltRounds = 10;
const secretKey = process.env.JWT_SECRET;

// Function to generate JWT Token
const generateToken = user => {
	return new Promise((resolve, reject) => {
		jwt.sign(
			{ id: user._id, email: user.email },
			secretKey,
			{ expiresIn: "7d" },
			(err, token) => {
				if (err) {
					return reject(err);
				}
				resolve(token);
			},
		);
	});
};

// Registration Route
router.post("/register", async (req, res) => {
	const { client, db } = await connectDB();
	const auth = db.collection("auth");

	try {
		const { email, password, confirmPassword } = req.body;

		// Basic validation
		if (!email || !password || !confirmPassword) {
			return res.status(400).json({ error: "All fields are required" });
		}

		if (password !== confirmPassword) {
			return res.status(400).json({ error: "Passwords do not match" });
		}

		// Check if the user already exists
		const existingUser = await auth.findOne({ email });
		if (existingUser) {
			return res.status(400).json({ error: "Email already in use" });
		}

		// Hash the password
		const hashedPassword = await bcrypt.hash(password, saltRounds);

		// Create the new user
		const newUser = {
			email,
			password: hashedPassword,
			createdAt: new Date(),
		};

		// Save the user in the database
		const result = await auth.insertOne(newUser);

		// Generate a JWT token
		const token = await generateToken(newUser);

		return res.status(201).json({
			message: "User registered successfully",
			token,
		});
	} catch (error) {
		console.error("Registration error:", error.message);
		res.status(500).json({ error: "Internal Server Error" });
	} finally {
		client.close(); // Close the connection after the operation is done
	}
});

// Login Route
router.post("/login", async (req, res) => {
	const { client, db } = await connectDB();
	const auth = db.collection("auth");

	try {
		const { email, password } = req.body;

		if (!email || !password) {
			return res.status(400).json({ error: "Email and Password are required" });
		}

		const user = await auth.findOne({ email });
		if (!user) {
			return res.status(401).json({ error: "Invalid email or password" });
		}

		// Compare passwords
		const isMatch = await bcrypt.compare(password, user.password);
		if (!isMatch) {
			return res.status(401).json({ error: "Invalid email or password" });
		}

		// Generate JWT token
		const token = await generateToken(user);

		return res
			.status(200)
			.json({ token, message: "User authenticated successfully" });
	} catch (error) {
		console.error("Login error:", error.message);
		res.status(500).json({ error: "Internal Server Error" });
	} finally {
		client.close(); // Close the connection after the operation is done
	}
});

// Create transport using nodemailer
const transporter = nodemailer.createTransport({
	service: "gmail",
	auth: {
		user: process.env.EMAIL, // Your Gmail address
		pass: process.env.EMAIL_PASSWORD, // Your Gmail password or app password
	},
});

// Contact form endpoint
router.post("/contact", async (req, res) => {
	const { fullName, phone, email, message } = req.body;
	if (!fullName || !phone || !email || !message) {
		return res.status(400).json({ error: "All fields are required" });
	}
	console.log(req.body, "body");
	const mailOptions = {
		from: email, // sender address
		to: process.env.EMAIL, // your email address to receive messages
		subject: `New Contact Form Submission from ${fullName}`,
		text: `Name: ${fullName}\nPhone: ${phone}\nEmail: ${email}\nMessage: ${message}`,
	};

	try {
		// Send email
		await transporter.sendMail(mailOptions);
		res.status(200).json({ message: "Mail sent successfully" });
	} catch (error) {
		console.error("Error sending email", error.message);
		res.status(500).json({ error: "Internal Server Error" });
	}
});

module.exports = router;
