import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

export const connectDB = async () => {
    try {
        console.log("Attempting to connect to MongoDB...");
        console.log("Database Name:", DB_NAME);

        const connectionInstance = await mongoose.connect(process.env.MONGODB_URI, {
            dbName: DB_NAME,
            retryWrites: true,
            w: "majority"
        });

        console.log("MongoDB connected successfully");
        console.log("Host:", connectionInstance.connection.host);
        console.log("Database:", connectionInstance.connection.name);
        console.log("Connection State:", connectionInstance.connection.readyState);
    } catch (error) {
        console.error("MongoDB connection error:", error.message);
        console.error("Full error:", error);

        if (error.message.includes("authentication failed")) {
            console.error("Authentication failed. Check your username and password in MONGODB_URI.");
        } else if (error.message.includes("network")) {
            console.error("Network error. Check your internet connection and MongoDB server status.");
        } else if (error.message.includes("ENOTFOUND")) {
            console.error("DNS error. Check the MongoDB host in MONGODB_URI.");
        }

        process.exit(1);
    }
};
