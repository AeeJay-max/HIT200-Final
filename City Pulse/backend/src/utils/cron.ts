import { IssueModel } from "../models/issue.model";
import { IssueStatusHistoryModel } from "../models/issueStatusHistory.model";
import { NotificationModel } from "../models/notification.model";
import { AdminModel } from "../models/admin.model";
import mongoose from "mongoose";
import { getIO } from "./socket";

export const startEscalationCron = () => {
    // Check every 5 minutes (300000ms)
    setInterval(async () => {
        // Skip if DB is not connected to avoid ECONNABORTED / Socket errors
        if (mongoose.connection.readyState !== 1) {
            console.warn("[ESCALATION CRON] Skipping check: Database not connected.");
            return;
        }

        try {
            // Find unresolved issues whose deadline has passed or SLA violated
            const expiredIssues = await IssueModel.find({
                status: { $in: ["Reported", "In Progress", "Worker Assigned"] },
                $or: [
                    { deadlineTimestamp: { $lt: new Date() } },
                    { "timeline.assignedAt": { $exists: false }, "timeline.reportedAt": { $lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
                    { status: "Worker Assigned", "timeline.workBegunAt": { $exists: false }, "timeline.assignedAt": { $lt: new Date(Date.now() - 48 * 60 * 60 * 1000) } },
                    { status: "In Progress", "timeline.resolvedAt": { $exists: false }, "timeline.workBegunAt": { $lt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) } }
                ],
                escalationLevel: { $lt: 3 },
            });

            if (expiredIssues.length === 0) return;

            const io = getIO();
            console.log(`[ESCALATION CRON] Found ${expiredIssues.length} expired issues.`);

            for (const issue of expiredIssues) {
                const now = new Date();
                const diffMs = now.getTime() - (issue.deadlineTimestamp?.getTime() || (issue as any).createdAt?.getTime() || Date.now());
                const hoursOverdue = diffMs / (1000 * 60 * 60);

                // PART 6: Escalate levels based on duration
                if (hoursOverdue >= 72) {
                    issue.escalationPriority = "High";
                    issue.escalationLevel = 3;
                } else if (hoursOverdue >= 48) {
                    issue.escalationLevel = 2;
                } else if (hoursOverdue >= 24) {
                    issue.escalationLevel = 1;
                }

                issue.status = "Escalated";
                if (!issue.timeline) issue.timeline = { reportedAt: issue.createdAt || new Date(), isOverdue: true };
                else issue.timeline.isOverdue = true;

                await issue.save();

                // PART 6: Notify stakeholders
                if (hoursOverdue >= 48) {
                    // Notify Main Admin for 48h+ overdue
                    const mainAdmins = await AdminModel.find({ role: "MAIN_ADMIN" });
                    for (const ma of mainAdmins) {
                        await NotificationModel.create({
                            title: `CRITICAL SLA BREACH: ${issue.title}`,
                            message: `Issue has been overdue for ${Math.floor(hoursOverdue)} hours. Main Admin attention required.`,
                            type: "Escalation",
                            priority: "Critical",
                            recipientId: ma._id,
                            linkTo: `/admin/issue/${issue._id}`,
                            deliveryStatus: "pending"
                        });
                    }
                } else if (hoursOverdue >= 24) {
                    // Notify Department Admin for 24h+ overdue
                    const deptAdmins = await AdminModel.find({ role: "DEPARTMENT_ADMIN", department: issue.assignedDepartment });
                    for (const da of deptAdmins) {
                        await NotificationModel.create({
                            title: `SLA BREACH ALERT: ${issue.title}`,
                            message: `Issue is 24h+ overdue. Department Admin intervention suggested.`,
                            type: "Escalation",
                            priority: "Urgent",
                            recipientId: da._id,
                            linkTo: `/admin/issue/${issue._id}`,
                            deliveryStatus: "pending"
                        });
                    }
                }


                // Find Main Admin to use as system identity or target
                const mainAdmin = await AdminModel.findOne({ role: "MAIN_ADMIN" });
                const systemId = mainAdmin ? mainAdmin._id : new mongoose.Types.ObjectId();

                // Log to history
                await IssueStatusHistoryModel.create({
                    issueID: issue._id,
                    status: "Escalated",
                    escalationLevel: issue.escalationLevel,
                    changedBy: systemId, // Represents system automatic change
                });

                // Notify Main Admin & Department Leadership
                const notification = await NotificationModel.create({
                    title: `ESCALATION LEVEL ${issue.escalationLevel}: Limit Exceeded`,
                    message: `Issue "${issue.title}" has exceeded its SLA deadline. Escalated to level ${issue.escalationLevel}.`,
                    type: "Escalation",
                    priority: "Critical",
                    linkTo: `/admin/issue/${issue._id}`,
                    createdBy: systemId,
                    deliveryStatus: "pending"
                });

                // Emit instant socket notification
                io.emit("new_notification", notification);
            }
        } catch (error) {
            console.error("[ESCALATION CRON] Error checking deadlines:", error);
        }
    }, 300000); // 5 minutes
};
