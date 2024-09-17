const multer = require("multer");

// Configure multer for file upload (e.g., avatars)
const storage = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null, "uploads/avatars"); // Adjust folder path as needed
	},
	filename: (req, file, cb) => {
		cb(null, `${Date.now()}_${file.originalname}`);
	},
});
const uploadTestimonial = multer({ storage });

module.exports = uploadTestimonial;
