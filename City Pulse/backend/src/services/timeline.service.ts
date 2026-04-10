import cron from "node-cron";
import { IssueModel } from "../models/issue.model";

export const initTimelineService = () => {
    // Run every 30 minutes
    cron.schedule("*/30 * * * *", async () => {
        console.log("[Timeline Service] Running SLA checks...");
        try {
            const now = new Date();

            // Check Reported -> Assigned within 24h
            const reportedOverdue = await IssueModel.find({
                status: "Reported",
                createdAt: { $lt: new Date(now.getTime() - 24 * 60 * 60 * 1000) },
                isOverdue: false
            });
            for (let issue of reportedOverdue) {
                issue.isOverdue = true;
                await issue.save();
                // Trigger notification: notify department admin, main admin, citizen
                console.log(`[Timeline] Issue ${issue._id} missed 24h assignment SLA`);
            }

            // Check Assigned -> In Progress within 48h
            const assignedOverdue = await IssueModel.find({
                status: { $in: ["Assigned", "Scheduled"] },
                assignedAt: { $lt: new Date(now.getTime() - 48 * 60 * 60 * 1000) },
                isOverdue: false
            });
            for (let issue of assignedOverdue) {
                issue.isOverdue = true;
                await issue.save();
                console.log(`[Timeline] Issue ${issue._id} missed 48h work-start SLA`);
            }

            // Check In Progress -> Resolved within 5 days
            const workOverdue = await IssueModel.find({
                status: "In Progress",
                workStartedAt: { $lt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000) },
                isOverdue: false
            });
            for (let issue of workOverdue) {
                issue.isOverdue = true;
                await issue.save();
                console.log(`[Timeline] Issue ${issue._id} missed 5 day resolution SLA`);
            }
        } catch (error) {
            console.error("[Timeline Service] Error during SLA checks", error);
        }
    });
};
