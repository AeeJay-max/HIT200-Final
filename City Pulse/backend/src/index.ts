import "dotenv/config";
import { connectDB } from "./config/database";
import app from "./app";
import { createServer } from "http";
import { initializeSocket } from "./utils/socket";
import { startEscalationCron } from "./utils/cron";
import { startTimelineEnforcementCron } from "./services/timeline.service";
import { initNotificationRetryCron } from "./services/notificationRetry.service";

// dotenv.config({ path: "./.env" }); is now handled by import "dotenv/config"

const PORT = process.env.PORT || 3000;

// Wrap express app with an HTTP server to use Socket.io
const httpServer = createServer(app);
initializeSocket(httpServer);

connectDB()
  .then(() => {
    httpServer.listen(PORT, () => {
      console.log(`Server & Real-Time Sync running on port : ${PORT}`);
      startEscalationCron();
      startTimelineEnforcementCron();
      initNotificationRetryCron();
      console.log("Timeline, Escalation & Notification Retry Cron Engines started.");
    });
  })
  .catch((error) => {
    console.log("MongoDB connection failed!\n", error);
    process.exit(1);
  });
