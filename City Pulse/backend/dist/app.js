"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const helmet_1 = __importDefault(require("helmet"));
const admin_routes_1 = __importDefault(require("./routes/admin.routes"));
const citizen_routes_1 = __importDefault(require("./routes/citizen.routes"));
const issue_routes_1 = __importDefault(require("./routes/issue.routes"));
const worker_routes_1 = __importDefault(require("./routes/worker.routes"));
const analytics_routes_1 = __importDefault(require("./routes/analytics.routes"));
const notification_routes_1 = __importDefault(require("./routes/notification.routes"));
const audit_routes_1 = __importDefault(require("./routes/audit.routes"));
const mongoose_1 = __importDefault(require("mongoose"));
const auth_middleware_1 = require("./middlerware/auth.middleware");
const requireRole_1 = require("./middlerware/requireRole");
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
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
const app = (0, express_1.default)();
// PART 13: Security Headers
app.use((0, helmet_1.default)());
// PART 3: Rate Limiting
const authLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 60 * 1000,
    max: 20,
    message: { message: "Too many login attempts. Please try again in an hour." }
});
const reportLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 1000,
    max: 5,
    message: { message: "Too many reports submitted. Please wait a minute." }
});
const voteLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 1000,
    max: 10,
    message: { message: "Voting too fast." }
});
app.use((0, cors_1.default)({
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    credentials: true,
}));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use(express_1.default.static("public"));
app.use((0, cookie_parser_1.default)());
// routes declaration
app.use("/api/v1/citizen/login", authLimiter);
app.use("/api/v1/admin/login", authLimiter);
app.use("/api/v1/worker/login", authLimiter);
app.use("/api/v1/issues/create", reportLimiter); // Check actual path
app.use("/api/v1/issues/:id/vote", voteLimiter);
app.use("/api/v1", citizen_routes_1.default);
app.use("/api/v1", admin_routes_1.default);
app.use("/api/v1", issue_routes_1.default);
app.use("/api/v1", worker_routes_1.default);
app.use("/api/v1/notifications", notification_routes_1.default);
app.use("/api/v1/analytics", analytics_routes_1.default);
app.use("/api/v1/audit", audit_routes_1.default);
// PART 15: System Health Monitoring
app.get("/api/v1/health", (req, res) => {
    res.json({
        status: "OK",
        uptime: process.uptime(),
        timestamp: new Date(),
        dbStatus: mongoose_1.default.connection.readyState === 1 ? "Connected" : "Disconnected",
        engines: ["Timeline", "Escalation", "Retry"]
    });
});
const notification_controller_1 = require("./controllers/notification.controller");
// PART 19: Disaster Broadcast Bypass (High Priority)
app.post("/api/v1/notifications/disaster-broadcast", auth_middleware_1.authMiddleware, (0, requireRole_1.requireRole)(["MAIN_ADMIN"]), notification_controller_1.disasterBroadcast);
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
exports.default = app;
