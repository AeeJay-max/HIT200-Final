import dotenv from "dotenv";
dotenv.config({ path: "./.env" });

const requiredEnvVars = [
  "JWT_SECRET",
  "MONGO_URI",
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
  "VAPID_PUBLIC_KEY",
  "VAPID_PRIVATE_KEY",
  "VAPID_MAILTO"
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`CRITICAL STARTUP ERROR: Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
}

import { connectDB } from "./config/database";
import app from "./app";
import { initTimelineService } from "./services/timeline.service";

initTimelineService();

const PORT = process.env.PORT || 3000;
connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server is running on port : ${PORT}`);
    });
  })
  .catch((error) => {
    console.log("MongoDB connection failed!\n", error);
    process.exit(1);
  });
