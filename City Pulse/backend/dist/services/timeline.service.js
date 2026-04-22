"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startTimelineEnforcementCron = void 0;
const node_cron_1 = __importDefault(require("node-cron"));
const issue_model_1 = require("../models/issue.model");
const notification_controller_1 = require("../controllers/notification.controller");
const admin_model_1 = require("../models/admin.model");
const mongoose_1 = __importDefault(require("mongoose"));
const startTimelineEnforcementCron = () => {
    // Run every 30 minutes
    node_cron_1.default.schedule('*/30 * * * *', () => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        if (mongoose_1.default.connection.readyState !== 1) {
            console.warn('Skipping timeline checks: Database not connected.');
            return;
        }
        console.log('Running timeline deadline enforcement checks...');
        const now = new Date();
        try {
            const overdueIssues = yield issue_model_1.IssueModel.find({
                status: { $ne: 'Resolved' },
                overdueStatus: false,
                deadlineTimestamp: { $lt: now }
            });
            const mainAdmin = yield admin_model_1.AdminModel.findOne({ role: 'MAIN_ADMIN' });
            for (const issue of overdueIssues) {
                issue.overdueStatus = true;
                if (issue.timeline)
                    issue.timeline.isOverdue = true;
                const delayMs = now.getTime() - (((_a = issue.deadlineTimestamp) === null || _a === void 0 ? void 0 : _a.getTime()) || now.getTime());
                issue.delayDuration = delayMs;
                issue.violationStage = issue.status;
                yield issue.save();
                // Notify Parties (PART 2)
                const delayHrs = Math.floor(delayMs / (1000 * 60 * 60));
                const alertMsg = `Issue "${issue.title}" is overdue by ${delayHrs} hours at the ${issue.status} stage.`;
                // 1. Notify Citizen
                if (issue.citizenId) {
                    yield (0, notification_controller_1.sendTargetedNotification)(issue.citizenId.toString(), "SLA Delayed", `Your report is taking longer than expected. We are escalating this.`, "Warning");
                }
                // 2. Notify Dept Admin
                if (issue.departmentAdminAssignedBy) {
                    yield (0, notification_controller_1.sendTargetedNotification)(issue.departmentAdminAssignedBy.toString(), "Overdue Alert", alertMsg, "Escalation");
                }
                // 3. Notify Main Admin
                if (mainAdmin) {
                    yield (0, notification_controller_1.sendTargetedNotification)(mainAdmin._id.toString(), "System Alert: Overdue Issue", alertMsg, "Critical");
                }
                console.log(`Issue ${issue._id} flagged as overdue and notifications sent.`);
            }
        }
        catch (error) {
            console.error('Timeline cron failed:', error);
        }
    }));
};
exports.startTimelineEnforcementCron = startTimelineEnforcementCron;
