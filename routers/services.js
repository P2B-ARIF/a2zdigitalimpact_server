const express = require("express");
const router = express.Router();
const connectDB = require("../config/db");
const { ObjectId } = require("mongodb");
const verifyJWT = require("../utils/authenticateToken");

let db;
const initDB = async () => {
	if (!db) {
		const { client, db: database } = await connectDB();
		db = database; // Store the database instance globally to reuse
	}
};

// Get all categories
router.get("/categories", async (req, res) => {
	try {
		await initDB(); // Ensure DB connection is initialized
		const categoriesCollection = db.collection("categories");
		const result = await categoriesCollection.find({}).toArray();
		res.status(200).send(result);
	} catch (error) {
		console.error("Error retrieving categories:", error.message);
		res.status(500).send({ error: "Internal Server Error" });
	}
});

// Get all services
router.get("/services", async (req, res) => {
	try {
		await initDB(); // Ensure DB connection is initialized
		const servicesCollection = db.collection("services");
		const result = await servicesCollection.find({}).toArray();
		res.status(200).send(result);
	} catch (error) {
		console.error("Error retrieving services:", error.message);
		res.status(500).send({ error: "Internal Server Error" });
	}
});

// Update a category
router.put("/category/update", async (req, res) => {
	try {
		await initDB(); // Ensure DB connection is initialized
		const categoriesCollection = db.collection("categories");
		const category = req.body;
		const result = await categoriesCollection.updateOne(
			{ _id: new ObjectId(category._id) },
			{ $set: { title: category.title, description: category.description } },
			{ upsert: true }, // Create if doesn't exist
		);
		res.status(200).send(result);
	} catch (error) {
		console.error("Error updating category:", error.message);
		res.status(500).send({ error: "Internal Server Error" });
	}
});

// Update a service
router.put("/service/update", async (req, res) => {
	try {
		await initDB();
		const servicesCollection = db.collection("services");
		const service = req.body;
		const result = await servicesCollection.updateOne(
			{ _id: new ObjectId(service._id) },
			{ $set: { title: service.title, description: service.description } },
			{ upsert: true },
		);
		res.status(200).send(result);
	} catch (error) {
		console.error("Error updating service:", error.message);
		res.status(500).send({ error: "Internal Server Error" });
	}
});

// Create a service
router.post("/service/create", verifyJWT, async (req, res) => {
	try {
		await initDB();
		const servicesCollection = db.collection("services");
		const service = req.body;
		const result = await servicesCollection.insertOne({
			...service,
			createdAt: new Date(),
		});
		res.status(200).send(result);
	} catch (error) {
		console.error("Error creating service:", error.message);
		res.status(500).send({ error: "Internal Server Error" });
	}
});

// Delete a service
router.delete("/service/delete/:id", async (req, res) => {
	try {
		await initDB();
		const servicesCollection = db.collection("services");
		const id = req.params.id;
		const result = await servicesCollection.deleteOne({
			_id: new ObjectId(id),
		});
		res.status(200).send(result);
	} catch (error) {
		console.error("Error deleting service:", error.message);
		res.status(500).send({ error: "Internal Server Error" });
	}
});

module.exports = router;
