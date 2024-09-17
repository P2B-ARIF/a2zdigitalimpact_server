const express = require("express");
const router = express.Router();
const connectDB = require("../config/db");
const uploadProject = require("../utils/storage/projects");
const { ObjectId } = require("mongodb");
const path = require("path");
const fs = require("fs");

let db;
const initDB = async () => {
	if (!db) {
		const { client, db: database } = await connectDB();
		db = database; // Reuse the database connection
	}
};

// Create a project
router.post("/create", uploadProject.single("image"), async (req, res) => {
	try {
		await initDB();
		const projectsCollection = db.collection("projects");
		const { link, category } = req.body;
		const image = req.file ? req.file.path : null;

		// Basic validation
		if (!link || !category) {
			return res.status(400).send({ error: "Link and category are required" });
		}

		const result = await projectsCollection.insertOne({
			link,
			category,
			image,
			createAt: new Date(),
			updateAt: new Date(),
		});
		return res
			.status(200)
			.json({ message: "Project created successfully", result });
	} catch (error) {
		console.error("Error creating project:", error.message);
		res.status(500).send({ error: "Internal Server Error" });
	}
});

// Read all projects
router.get("/get", async (req, res) => {
	try {
		await initDB(); // Ensure database is initialized
		const projectsCollection = await db.collection("projects");
		const result = await projectsCollection.find({}).toArray();
		res.status(200).json(result);
	} catch (error) {
		console.error("Error reading projects:", error.message); // Log the error message
		res.status(500).send({ error: "Internal Server Error" }); // Send detailed error response
	}
});

// Delete a project
router.put("/delete/:id", async (req, res) => {
	try {
		await initDB(); // Ensure database is initialized
		const projectsCollection = db.collection("projects");
		const { id } = req.params;
		const details = req.body;
		console.log(details, "details");

		if (!ObjectId.isValid(id)) {
			return res.status(400).send({ error: "Invalid project ID" });
		}
		const file = details?.image?.split("projects\\")[1];
		const filePath = path.join(__dirname, `./../uploads/projects/${file}`);
		fs.unlink(filePath, err => {
			if (err) {
				console.error(err.message);
			}
		});

		const result = await projectsCollection.deleteOne({
			_id: new ObjectId(id),
		});

		if (result.deletedCount === 0) {
			return res.status(404).send({ error: "Project not found" });
		}

		return res.status(200).send({ message: "Project deleted successfully" });
	} catch (error) {
		console.error("Error deleting project:", error.message);
		res.status(500).send({ error: "Internal Server Error" });
	}
});

module.exports = router;
