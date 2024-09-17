const multer = require("multer");

// Multer configuration
const storage = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null, "uploads/brands");
	},
	filename: (req, file, cb) => {
		cb(null, `${Date.now()}_${file.originalname}`);
	},
});

const uploadBrands = multer({ storage });

module.exports = uploadBrands;
