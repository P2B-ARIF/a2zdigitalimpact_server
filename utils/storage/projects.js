const multer = require("multer");

// Multer configuration
const storage = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null, "uploads/projects");
	},
	filename: (req, file, cb) => {
		cb(null, `${Date.now()}_${file.originalname}`);
	},
});

const uploadProject = multer({ storage });

module.exports = uploadProject;
