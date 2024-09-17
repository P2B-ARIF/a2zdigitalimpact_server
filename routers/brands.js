const express = require("express");
const router = express.Router();
const connectDB = require("../config/db");

let db;
const initDB = async () => {
	if (!db) {
		const { client, database } = await connectDB();
		db = database;
	}
};

router.post("/create", async (req, res) => {
	await initDB(); // Ensure database is initialized
	const brandsCollection = db.collection("brands");

	try {
		const { name, link, image } = req.body;
		if (!name || !link || !image) {
			return res.status(400).send({ error: "All fields are required" });
		}
		const newBrand = { name, link, image, createDate: new Date() };
		const result = await brandsCollection.insertOne(newBrand);
		res.status(201).send({
			message: "Brand created successfully",
			brandId: result.insertedId,
		});
	} catch (error) {
		console.error("Error creating brand:", error.message);
		res.status(500).send({ error: "Internal Server Error" });
	} finally {
		client.close(); // Close the MongoDB connection after operation
	}
});

router.put("/update/:id", async (req, res) => {
	await initDB(); // Ensure database is initialized
	const brandsCollection = db.collection("brands");

	try {
		const { id } = req.params;
		const { name, link, image } = req.body;

		// Basic validation
		if (!name || !link || !image) {
			return res.status(400).send({ error: "All fields are required" });
		}

		// Find and update the brand
		const result = await brandsCollection.updateOne(
			{ _id: new require("mongodb").ObjectId(id) },
			{ $set: { name, link, image, updatedAt: new Date() } },
		);

		if (result.matchedCount === 0) {
			return res.status(404).send({ error: "Brand not found" });
		}

		// Send a success response
		res.send({ message: "Brand updated successfully" });
	} catch (error) {
		console.error("Error updating brand:", error.message);
		res.status(500).send({ error: "Internal Server Error" });
	} finally {
		client.close(); // Close the MongoDB connection after operation
	}
});

router.delete("/delete/:id", async (req, res) => {
	await initDB(); // Ensure database is initialized
	const brandsCollection = db.collection("brands");

	try {
		const { id } = req.params;

		// Delete the brand
		const result = await brandsCollection.deleteOne({
			_id: new require("mongodb").ObjectId(id),
		});

		if (result.deletedCount === 0) {
			return res.status(404).send({ error: "Brand not found" });
		}

		// Send a success response
		res.send({ message: "Brand deleted successfully" });
	} catch (error) {
		console.error("Error deleting brand:", error.message);
		res.status(500).send({ error: "Internal Server Error" });
	} finally {
		client.close(); // Close the MongoDB connection after operation
	}
});

module.exports = router;
