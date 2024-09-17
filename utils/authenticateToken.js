require("dotenv").config();
const jwt = require("jsonwebtoken");

const secretKey = process.env.JWT_SECRET;
if (!secretKey) {
	throw new Error("JWT_SECRET is not defined in environment variables.");
}

const verifyJWT = (req, res, next) => {
	const authHeader = req.headers.authorization;

	if (!authHeader) {
		return res.status(401).json({
			access: false,
			message: "Unauthorized access. No token provided.",
		});
	}

	const token = authHeader.split(" ")[1];
	if (!token) {
		return res.status(401).json({
			access: false,
			message: "Unauthorized access. Invalid token format.",
		});
	}

	jwt.verify(JSON.parse(token), secretKey, (err, decoded) => {
		if (err) {
			console.log(err, "err");
			return res.status(403).json({
				access: false,
				message: "Forbidden access. Invalid or expired token.",
			});
		}

		req.decoded = decoded;
		next();
	});
};

module.exports = verifyJWT;
