import mongoose from "mongoose";
import "dotenv/config";

const DATABASE_URL = process.env.DATABASE_URL || "";

export const connectDB = async () => {
  console.log("Using MongoDB URL:", process.env.DATABASE_URL);

  try {
    await mongoose.connect(DATABASE_URL, {
      maxPoolSize: 20,
      minPoolSize: 5,
    });
    console.log("Connected to DB !");
  } catch (err) {
    console.error("DB connection error:", err);
  }
};
