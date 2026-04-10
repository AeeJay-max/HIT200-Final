import cron from "node-cron";
import { NotificationModel } from "../models/notification.model";
import { CitizenModel } from "../models/citizen.model";
import webpush from "web-push";

// Simulate saving individual delivery statuses or at least retrying missing ones
export const initNotificationRetryService = () => {
    // Run every 10 minutes
    cron.schedule("*/10 * * * *", async () => {
        try {
            console.log("Running Notification Delivery Retry Service...");

            // In a real implementation this would fetch { deliveryStatus: "failed" }
            // For now, it's a structural mock demonstrating how we inject the retry logic
            const failedBroadcasts = await NotificationModel.find({ type: "BROADCAST", createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } }).limit(5);

            // Retry logic
            for (const broadcast of failedBroadcasts) {
                // re-emit
            }
        } catch (error) {
            console.error("Error in Notification Retry Service:", error);
        }
    });
};
