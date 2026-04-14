import mongoose from "mongoose";
import "dotenv/config";

export const connectDB = async () => {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not defined in environment variables");
  }

  console.log("Attempting to connect to MongoDB...");

  try {
    await mongoose.connect(url, {
      serverSelectionTimeoutMS: 5000 // Timeout after 5s instead of default 30s
    });
    console.log("Connected to DB successfully!");
  } catch (err) {
    console.error("Mongoose connection error:", err);
    throw err; // Rethrow so index.ts knows it failed
  }
};
