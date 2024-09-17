const express = require("express");
const router = express.Router();
const connectDB = require("../config/db");
const uploadImages = require("../utils/storage/images");
const uploadBrands = require("../utils/storage/brands");
const { ObjectId } = require("mongodb");
const path = require("path");
const fs = require("fs");

let db; // Global variable for database

const initDB = async () => {
	if (!db) {
		const { client, db: database } = await connectDB();
		db = database; // Reuse the database connection
	}
};

// Get all controllers
router.get("/get", async (req, res) => {
	try {
		await initDB();
		const controllerCollection = db.collection("controller");
		const results = await controllerCollection.find({}).toArray();
		res.status(200).json(results);
	} catch (err) {
		console.error("Error retrieving controllers:", err);
		res.status(500).json({ message: "Server error", error: err });
	}
});

// Update Hero Section
router.put(
	"/hero/update",
	uploadImages.array("newImages"),
	async (req, res) => {
		try {
			await initDB();
			const controllerCollection = db.collection("controller");
			const { title, description, id, existingImages, deletedImages } =
				req.body;

			const newImages = req.files.map(file => file.path);
			const existingImagesArray = existingImages
				? JSON.parse(existingImages)
				: [];

			// Validate image count before proceeding
			if (newImages.length + existingImagesArray.length > 3) {
				return res
					.status(400)
					.json({ message: "Cannot upload more than 3 images" });
			}

			if (deletedImages?.length) {
				const filesArray = Array.isArray(deletedImages)
					? deletedImages
					: [deletedImages];
				filesArray.forEach(filename => {
					const filePath = path.join(
						__dirname,
						`../uploads/images/${filename}`,
					);
					fs.unlink(filePath, err => {
						if (err) {
							errors.push({
								filename,
								error: "File not found or error deleting",
							});
						}
					});
				});
			}

			// Update the hero section
			const result = await controllerCollection.updateOne(
				{ section: "hero" },
				{
					$set: {
						title,
						description,
						images: [...existingImagesArray, ...newImages],
						updateAt: new Date(),
					},
				},
				{ upsert: true },
			);

			// If no document was updated, return not found
			if (result.matchedCount === 0) {
				return res.status(404).json({ message: "Hero section not found" });
			}

			const updatedHero = await controllerCollection.findOne({
				section: "hero",
			});
			res.status(200).json(updatedHero);
		} catch (error) {
			console.error("Error updating hero section:", error);
			res.status(500).json({ message: "Server error", error });
		}
	},
);

// Add or Update Brands Section
router.put("/brands", uploadBrands.single("image"), async (req, res) => {
	try {
		await initDB();
		const controllerCollection = db.collection("controller");
		const { link } = req.body;
		const image = req.file ? req.file.path : null;
		const brand = { link, image, id: Date.now() };

		const find = await controllerCollection.findOne({ section: "brands" });

		if (find) {
			// Update brands array if section exists
			const result = await controllerCollection.updateOne(
				{ section: "brands" },
				{ $push: { brandsArr: brand }, $set: { updateAt: new Date() } },
			);
			res.status(200).json({ message: "Brand created successfully", result });
		} else {
			// Create a new brands section
			const result = await controllerCollection.insertOne({
				section: "brands",
				brandsArr: [brand],
				createAt: new Date(),
				updateAt: new Date(),
			});
			res.status(200).json({ message: "Brand created successfully", result });
		}
	} catch (error) {
		console.error("Error updating brands:", error);
		res.status(500).json({ message: "Server error", error });
	}
});

// Delete a Brand
router.delete("/brands/:id", async (req, res) => {
	try {
		await initDB();
		const controllerCollection = db.collection("controller");
		const { id } = req.params;
		let error = null;

		const find = await controllerCollection.findOne({ section: "brands" });
		if (find) {
			const arr = find.brandsArr.find(brand => brand.id === parseInt(id));
			const filePath = path.join(
				__dirname,
				`./../uploads/brands/${arr.image.split("brands\\")[1]}`,
			);
			fs.unlink(filePath, err => {
				if (err) {
					setError({ message: "File not found or error deleting" });
				}
			});
			const result = await controllerCollection.updateOne(
				{ section: "brands" },
				{
					$pull: { brandsArr: { id: parseInt(id) } },
					$set: { updateAt: new Date() },
				},
			);
			if (result.modifiedCount > 0) {
				return res.status(200).json({ message: "Brand deleted successfully" });
			} else {
				return res.status(404).json({ message: "Brand not found" });
			}
		} else {
			return res.status(404).json({ message: "Brands section not found" });
		}
	} catch (error) {
		console.error("Error deleting brand:", error);
		res.status(500).json({ message: "Server error", error });
	}
});

// Update About Section
router.put(
	"/about/update",
	uploadImages.array("newImages"),
	async (req, res) => {
		try {
			await initDB();
			const controllerCollection = db.collection("controller");
			const about = req.body;
			const newImages = req.files.map(file => file.path);
			const existingImagesArray = about.images ? JSON.parse(about.images) : [];

			// Validate image count
			if (newImages.length + existingImagesArray.length > 2) {
				return res
					.status(400)
					.json({ message: "You can only upload up to 2 images in total." });
			}

			// delete image start
			if (about?.deletedImages?.length > 0) {
				const filesArray = Array.isArray(about.deletedImages)
					? about.deletedImages
					: [about.deletedImages];
				filesArray.forEach(filename => {
					const filePath = path.join(
						__dirname,
						`../uploads/images/${filename}`,
					);
					fs.unlink(filePath, err => {
						if (err) {
							console.error({
								filename,
								error: "File not found or error deleting",
							});
						}
					});
				});
			}
			// delete image end

			// Update the about section
			const result = await controllerCollection.updateOne(
				{ section: "about" },
				{
					$set: {
						title: about.title,
						whoweare: about.whoweare,
						mission: about.mission,
						points: JSON.parse(about.points),
						images: [...existingImagesArray, ...newImages],
						updateAt: new Date(),
					},
				},
				{ upsert: true },
			);

			if (result.matchedCount === 0) {
				return res.status(404).json({ message: "About section not found" });
			}

			const updatedAbout = await controllerCollection.findOne({
				section: "about",
			});
			res.status(200).json(updatedAbout);
		} catch (error) {
			console.error("Error updating about section:", error);
			res.status(500).json({ message: "Server error", error });
		}
	},
);

// Update CTA Section
router.put("/cta/update", uploadImages.array("newImages"), async (req, res) => {
	try {
		await initDB();
		const controllerCollection = db.collection("controller");
		const cta = req.body;
		const newImages = req.files.map(file => file.path);
		const existingImagesArray = cta.images ? JSON.parse(cta.images) : [];

		if (newImages.length + existingImagesArray.length > 2) {
			return res
				.status(400)
				.json({ message: "You can only upload up to 2 images in total." });
		}

		// delete image start
		if (cta?.deletedImages?.length > 0) {
			const filesArray = Array.isArray(cta.deletedImages)
				? cta.deletedImages
				: [cta.deletedImages];
			filesArray.forEach(filename => {
				const filePath = path.join(__dirname, `../uploads/images/${filename}`);
				fs.unlink(filePath, err => {
					if (err) {
						console.error({
							filename,
							error: "File not found or error deleting",
						});
					}
				});
			});
		}
		// delete image end

		const result = await controllerCollection.updateOne(
			{ section: "cta" },
			{
				$set: {
					...cta,
					images: [...existingImagesArray, ...newImages],
					updateAt: new Date(),
				},
			},
			{ upsert: true },
		);

		if (result.matchedCount === 0) {
			return res.status(404).json({ message: "CTA section not found." });
		}

		const updatedCTA = await controllerCollection.findOne({ section: "cta" });
		res.status(200).json(updatedCTA);
	} catch (error) {
		console.error("Error updating CTA section:", error);
		res.status(500).json({ message: "Server error", error });
	}
});

// Update Achievement Section
router.put("/achievement/update", async (req, res) => {
	try {
		await initDB();
		const controllerCollection = db.collection("controller");
		const achievement = req.body;

		console.log("hello");

		if (!achievement || !achievement.section) {
			return res
				.status(400)
				.json({ message: "Invalid data. Section identifier is required." });
		}

		const { _id, ...rest } = achievement;
		const result = await controllerCollection.updateOne(
			{ section: "achievement" },
			{ $set: { ...rest, updateAt: new Date() } },
			{ upsert: true },
		);

		const updatedAchievement = await controllerCollection.findOne({
			section: "achievement",
		});

		if (!updatedAchievement) {
			return res
				.status(404)
				.json({ message: "Achievement section not found." });
		}

		res.status(200).json(updatedAchievement);
	} catch (error) {
		console.error("Error updating achievement section:", error);
		res.status(500).json({ message: "Server error", error });
	}
});

module.exports = router;
