import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import adminRoutes from "./routes/admin.routes";
import citizenRoutes from "./routes/citizen.routes";
import issueRoutes from "./routes/issue.routes";
import workerRoutes from "./routes/worker.routes";
import analyticsRoutes from "./routes/analytics.routes";
import notificationRoutes from "./routes/notification.routes";
import auditRoutes from "./routes/audit.routes";
import dashboardRoutes from "./routes/dashboard.routes";
import mongoose from "mongoose";
import { authMiddleware } from "./middlerware/auth.middleware";
import { requireRole } from "./middlerware/requireRole";
import rateLimit from "express-rate-limit";

// PART 16: Environment Variable Validation
const requiredEnv = [
  "DATABASE_URL",
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET"
];
requiredEnv.forEach(env => {
  if (!process.env[env]) {
    console.error(`FATAL ERROR: Environment variable ${env} is missing.`);
    process.exit(1);
  }
});
if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
  console.warn("WARNING: Web Push (VAPID) keys are missing. Push notifications will be disabled.");
}

const app = express();

// PART 13: Security Headers
app.use(helmet());

// PART 3: Rate Limiting
const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: { message: "Too many login attempts. Please try again in an hour." }
});

const reportLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: { message: "Too many reports submitted. Please wait a minute." }
});

const voteLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { message: "Voting too fast." }
});

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(cookieParser());


// routes declaration

app.use("/api/v1/citizen/login", authLimiter);
app.use("/api/v1/admin/login", authLimiter);
app.use("/api/v1/worker/login", authLimiter);
app.use("/api/v1/issues/create", reportLimiter); // Check actual path
app.use("/api/v1/issues/:id/vote", voteLimiter);

app.use("/api/v1", citizenRoutes);
app.use("/api/v1", adminRoutes);
app.use("/api/v1", issueRoutes);
app.use("/api/v1", workerRoutes);
app.use("/api/v1/notifications", notificationRoutes);
app.use("/api/v1/analytics", analyticsRoutes);
app.use("/api/v1/audit", auditRoutes);
app.use("/api/v1/dashboard", dashboardRoutes);

// PART 15: System Health Monitoring
app.get("/api/v1/health", (req, res) => {
  res.json({
    status: "OK",
    uptime: process.uptime(),
    timestamp: new Date(),
    dbStatus: mongoose.connection.readyState === 1 ? "Connected" : "Disconnected",
    engines: ["Timeline", "Escalation", "Retry"]
  });
});

import { disasterBroadcast } from "./controllers/notification.controller";

// PART 19: Disaster Broadcast Bypass (High Priority)
app.post("/api/v1/notifications/disaster-broadcast", authMiddleware, requireRole(["MAIN_ADMIN"]), disasterBroadcast);

app.use("/api", (_req, res) => {
  res.status(404).json({ message: "API route not found" });
});
app.get('/', (req, res) => {
  res.send('Civic Issue Reporter Backend is Running');
});


// compatibility for JWT secret names
if (!process.env.JWT_SECRET && process.env.JWT_PASSWORD) {
  process.env.JWT_SECRET = process.env.JWT_PASSWORD;
}

export default app;
