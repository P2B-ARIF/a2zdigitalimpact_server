const express = require("express");
const router = express.Router();
const uploadBlogs = require("../utils/storage/blogs");
const verifyJWT = require("../utils/authenticateToken");
const path = require("path");
const fs = require("fs");
const connectDB = require("../config/db");
const { ObjectId } = require("mongodb");

let db;
const initDB = async () => {
	if (!db) {
		const { client, db: database } = await connectDB();
		db = database; // Reuse the database connection
	}
};

// Upload image
router.post("/image/upload", uploadBlogs.single("image"), (req, res) => {
	try {
		const file = req.file;
		if (!file) {
			return res.status(400).json({ message: "No file uploaded" });
		}
		const imageUrl = `${req.protocol}://${req.get("host")}/uploads/avatars/${
			file.filename
		}`;
		res.status(200).json({ imageUrl });
	} catch (error) {
		res.status(500).json({ error: "Internal server error" });
	}
});

// get blog images
router.get("/image/read", (req, res) => {
	const directoryPath = path.join(__dirname, "./../uploads/blogs");
	fs.readdir(directoryPath, (err, files) => {
		if (err) {
			return res.status(500).send({ message: "Unable to scan files" });
		}
		const imageUrls = files.map(
			file => `${req.protocol}://${req.get("host")}/uploads/blogs/${file}`,
		);
		res.status(200).json(imageUrls);
	});
});

// Delete an image
router.delete("/image/delete/:filename", (req, res) => {
	const filename = req.params.filename;
	const filePath = path.join(__dirname, `../uploads/blogs/${filename}`);

	fs.unlink(filePath, err => {
		if (err) {
			return res
				.status(500)
				.json({ message: "File not found or error deleting" });
		}
		res.status(200).json({ message: "File deleted successfully" });
	});
});

router.post("/api/create", verifyJWT, async (req, res) => {
	try {
		await initDB();
		const blogsCollection = db.collection("blogs");
		const blog = req.body;
		const result = await blogsCollection.insertOne({
			...blog,
			createdAt: new Date(),
			updatedAt: new Date(),
		});
		res.status(201).send(result);
	} catch (error) {
		console.error("Error creating blog:", error.message);
		res.status(500).send({ error: "Internal Server Error" });
	}
});

router.put("/api/update/:id", verifyJWT, async (req, res) => {
	try {
		await initDB();
		const blogsCollection = db.collection("blogs");
		const blogId = req.params.id;
		const updatedBlog = req.body;
		const { _id, ...rest } = updatedBlog;
		const result = await blogsCollection.updateOne(
			{ _id: new ObjectId(blogId) },
			{
				$set: {
					...rest,
					updatedAt: new Date(),
				},
			},
		);
		res.status(200).send(result);
	} catch (error) {
		console.error("Error updating blog:", error.message);
		res.status(500).send({ error: "Internal Server Error" });
	}
});

router.get("/api/read", async (req, res) => {
	try {
		await initDB();
		const blogsCollection = db.collection("blogs");
		const blogs = await blogsCollection.find({}).toArray();
		res.status(200).send(blogs);
	} catch (error) {
		console.error("Error fetching blogs:", error.message);
		res.status(500).send({ error: "Internal Server Error" });
	}
});

// router.get("/blog/:id", async (req, res) => {
// 	try {
// 		await initDB();
// 		const blogId = req.params.id;
// 		const blogsCollection = db.collection("blogs");
// 		const blog = await blogsCollection.findOne({ _id: new ObjectId(blogId) });

// 		if (!blog) {
// 			return res.status(404).send({ error: "Blog not found" });
// 		}

// 		res.status(200).send(blog);
// 	} catch (error) {
// 		console.error("Error fetching blog:", error.message);
// 		res.status(500).send({ error: "Internal Server Error" });
// 	}
// });

router.delete("/api/delete", verifyJWT, async (req, res) => {
	try {
		await initDB();
		const blogId = req.query;
		const blogsCollection = db.collection("blogs");

		const result = await blogsCollection.deleteOne({
			_id: new ObjectId(blogId),
		});
		if (result.deletedCount === 0) {
			return res.status(404).send({ error: "Blog not found" });
		}

		res.status(200).send({ message: "Blog deleted successfully" });
	} catch (error) {
		console.error("Error deleting blog:", error.message);
		res.status(500).send({ error: "Internal Server Error" });
	}
});

module.exports = router;
