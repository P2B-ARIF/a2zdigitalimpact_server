
const { MongoClient } = require("mongodb");
require("dotenv").config();

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;
  
  if (!uri) {
    console.error("MONGODB_URI is not defined in environment variables.");
    process.exit(1); // Exit if no URI is provided
  }
  
  const client = new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    ssl: true,  // For SSL-enabled environments
    tlsAllowInvalidCertificates: process.env.NODE_ENV !== "production", // Only allow in development
  });

  try {
    // Attempt to connect to MongoDB
    await client.connect();
    console.log("MongoDB Connected successfully.");
    
    // Access the database
    const db = client.db(process.env.DB_NAME);
    return { client, db }; // Return the client and db for further use
  } catch (error) {
    console.error("MongoDB connection failed:", error);
    
    // Close the client connection if it was opened
    if (client) {
      await client.close();
    }
    
    process.exit(1); // Exit the process if there's an error
  }
};

module.exports = connectDB;




// const { MongoClient } = require("mongodb");
// require("dotenv").config();

// const connectDB = async () => {
// 	const uri = process.env.MONGODB_URI;
// 	if (!uri) {
// 		console.error("MONGODB_URI is not defined");
// 		process.exit(1);
// 	}
// 	const client = new MongoClient(uri, {
// 		// useNewUrlParser: true,
// 		// useUnifiedTopology: true,
// 		useNewUrlParser: true,
// 		useUnifiedTopology: true,
// 		ssl: true,
// 		tlsAllowInvalidCertificates: true, // only for local development; avoid in production
// 	});
// 	try {
// 		await client.connect();
// 		console.log("MongoDB Connected...");
// 		const db = client.db(process.env.DB_NAME);
// 		return { client, db };
// 	} catch (error) {
// 		console.error("MongoDB connection failed:", error.message);
// 		process.exit(1);
// 	}
// };

// module.exports = connectDB;
