import cron from "node-cron";
import { NotificationModel } from "../models/notification.model";
import { CitizenModel } from "../models/citizen.model";
import { AdminModel } from "../models/admin.model";
import webpush from "web-push";
import mongoose from "mongoose";

export const initNotificationRetryCron = () => {
    // PART 5: Retry every 10 minutes
    cron.schedule("*/10 * * * *", async () => {
        if (mongoose.connection.readyState !== 1) {
            console.warn("Skipping notification retry: Database not connected.");
            return;
        }
        console.log("Running Notification Retry Service...");

        const failedNotifications = await NotificationModel.find({
            deliveryStatus: { $in: ["failed", "pending"] },
            retryCount: { $lt: 5 } // Max 5 retries
        });

        for (const notification of failedNotifications) {
            try {
                notification.deliveryStatus = "retrying";
                await notification.save();

                if (notification.recipientId) {
                    // Targeted retry
                    const user = await CitizenModel.findById(notification.recipientId) ||
                        await AdminModel.findById(notification.recipientId);

                    if (user?.pushSubscription) {
                        await webpush.sendNotification(
                            user.pushSubscription as any,
                            JSON.stringify({
                                title: notification.title,
                                message: notification.message,
                                type: notification.type
                            })
                        );
                    }
                }

                notification.deliveryStatus = "sent";
                await notification.save();
            } catch (error) {
                notification.deliveryStatus = "failed";
                notification.retryCount += 1;
                await notification.save();
                console.error(`Retry failed for notification ${notification._id}:`, error);
            }
        }
    });
};
