const express = require("express");
const router = express.Router();
const connectDB = require("../config/db");
const uploadTestimonial = require("../utils/storage/avatars");
const { ObjectId } = require("mongodb");
const path = require("path");
const fs = require("fs");

let db; // Global variable for database

const initDB = async () => {
	if (!db) {
		const { db: database } = await connectDB();
		db = database; // Reuse the database connection
	}
};

// Route to create a testimonial
router.post("/create", uploadTestimonial.single("avatar"), async (req, res) => {
	try {
		await initDB();
		const testimonials = db.collection("testimonials");
		const { name, role, rating, message } = req.body;
		const avatar = req.file ? req.file.path : null;

		const testimonial = {
			name,
			role,
			rating: parseInt(rating),
			message,
			avatar,
			createAt: new Date(),
			updateAt: new Date(),
		};

		const result = await testimonials.insertOne(testimonial);
		return res
			.status(200)
			.json({ message: "Testimonial created successfully", result });
	} catch (error) {
		console.error("Error creating testimonial:", error.message);
		res.status(500).json({ message: "Server error", error });
	}
});

// Route to read all testimonials
router.get("/read", async (req, res) => {
	try {
		await initDB();
		const testimonials = db.collection("testimonials");
		const result = await testimonials.find({}).toArray();
		return res.status(200).json(result);
	} catch (error) {
		console.error("Error reading testimonials:", error.message);
		res.status(500).json({ message: "Server error", error });
	}
});

// Route to delete a testimonial
router.put("/delete/:id", async (req, res) => {
	try {
		await initDB();
		const testimonials = db.collection("testimonials");
		const { id } = req.params;
		const { avatar } = req.body;

		if (avatar) {
			const filePath = path.join(__dirname, `../uploads/avatars/${avatar}`);
			fs.unlink(filePath, err => {
				if (err) {
					console.error({
						avatar,
						error: "File not found or error deleting",
					});
				}
			});
		}

		const result = await testimonials.deleteOne({ _id: new ObjectId(id) });

		if (result.deletedCount === 0) {
			return res.status(404).send({ error: "Testimonial not found" });
		}

		res.status(200).send({ message: "Testimonial deleted successfully" });
	} catch (error) {
		console.error("Error deleting testimonial:", error.message);
		res.status(500).send({ error: "Internal Server Error" });
	}
});

// Route to update a testimonial
router.put("/update/:id", async (req, res) => {
	try {
		await initDB();
		const testimonials = db.collection("testimonials");
		const { id } = req.params;
		const { rating, description, image, name, profession } = req.body;

		// Basic validation
		if (!rating || !description || !image || !name || !profession) {
			return res.status(400).send({ error: "All fields are required" });
		}

		const result = await testimonials.updateOne(
			{ _id: new ObjectId(id) },
			{
				$set: {
					rating,
					description,
					image,
					name,
					profession,
					updateAt: new Date(),
				},
			},
		);

		if (result.matchedCount === 0) {
			return res.status(404).send({ error: "Testimonial not found" });
		}

		res.status(200).send({ message: "Testimonial updated successfully" });
	} catch (error) {
		console.error("Error updating testimonial:", error.message);
		res.status(500).send({ error: "Internal Server Error" });
	}
});

module.exports = router;
