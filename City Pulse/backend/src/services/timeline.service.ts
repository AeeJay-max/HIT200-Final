import cron from 'node-cron';
import { IssueModel } from '../models/issue.model';
import { sendTargetedNotification } from '../controllers/notification.controller';
import { AdminModel } from '../models/admin.model';
import mongoose from 'mongoose';

export const startTimelineEnforcementCron = () => {
    // Run every 30 minutes
    cron.schedule('*/30 * * * *', async () => {
        if (mongoose.connection.readyState !== 1) {
            console.warn('Skipping timeline checks: Database not connected.');
            return;
        }
        console.log('Running timeline deadline enforcement checks...');
        const now = new Date();

        try {
            const overdueIssues = await IssueModel.find({
                status: { $ne: 'Resolved' },
                overdueStatus: false,
                deadlineTimestamp: { $lt: now }
            }).populate('assignedDepartment');

            const mainAdmin = await AdminModel.findOne({ role: 'MAIN_ADMIN' });

            for (const issue of overdueIssues) {
                issue.overdueStatus = true;
                if (issue.timeline) issue.timeline.isOverdue = true;

                const delayMs = now.getTime() - (issue.deadlineTimestamp?.getTime() || now.getTime());
                issue.delayDuration = delayMs;
                issue.violationStage = issue.status;

                await issue.save();

                // Notify Parties (PART 2)
                const delayHrs = Math.floor(delayMs / (1000 * 60 * 60));
                const alertMsg = `Issue "${issue.title}" is overdue by ${delayHrs} hours at the ${issue.status} stage.`;

                // 1. Notify Citizen
                if (issue.citizenId) {
                    await sendTargetedNotification(issue.citizenId.toString(), "SLA Delayed", `Your report is taking longer than expected. We are escalating this.`, "Warning");
                }

                // 2. Notify Dept Admin
                if (issue.departmentAdminAssignedBy) {
                    await sendTargetedNotification(issue.departmentAdminAssignedBy.toString(), "Overdue Alert", alertMsg, "Escalation");
                }

                // 3. Notify Main Admin
                if (mainAdmin) {
                    await sendTargetedNotification(mainAdmin._id.toString(), "System Alert: Overdue Issue", alertMsg, "Critical");
                }

                console.log(`Issue ${issue._id} flagged as overdue and notifications sent.`);
            }
        } catch (error) {
            console.error('Timeline cron failed:', error);
        }
    });
};
