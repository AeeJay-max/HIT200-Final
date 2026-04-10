"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const database_1 = require("./config/database");
const app_1 = __importDefault(require("./app"));
const http_1 = require("http");
const socket_1 = require("./utils/socket");
const cron_1 = require("./utils/cron");
const timeline_service_1 = require("./services/timeline.service");
const notificationRetry_service_1 = require("./services/notificationRetry.service");
// dotenv.config({ path: "./.env" }); is now handled by import "dotenv/config"
const PORT = process.env.PORT || 3000;
// Wrap express app with an HTTP server to use Socket.io
const httpServer = (0, http_1.createServer)(app_1.default);
(0, socket_1.initializeSocket)(httpServer);
(0, database_1.connectDB)()
    .then(() => {
    httpServer.listen(PORT, () => {
        console.log(`Server & Real-Time Sync running on port : ${PORT}`);
        (0, cron_1.startEscalationCron)();
        (0, timeline_service_1.startTimelineEnforcementCron)();
        (0, notificationRetry_service_1.initNotificationRetryCron)();
        console.log("Timeline, Escalation & Notification Retry Cron Engines started.");
    });
})
    .catch((error) => {
    console.log("MongoDB connection failed!\n", error);
    process.exit(1);
});
