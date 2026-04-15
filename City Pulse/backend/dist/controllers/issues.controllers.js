"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
exports.getIssueHistory = exports.getAssignmentStats = exports.reassignWorker = exports.rejectAssignment = exports.acceptAssignment = exports.getServiceOutages = exports.getPublicSchedule = exports.getVotes = exports.getIssueTrackingStatus = exports.assignDepartmentAdmin = exports.assignWorker = exports.getPublicAnalytics = exports.updateDumpingStage = exports.voteIssue = exports.upvoteIssue = exports.getIssues = exports.createIssue = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const issue_model_1 = require("../models/issue.model");
const multimedia_model_1 = require("../models/multimedia.model");
const department_model_1 = require("../models/department.model");
const department_1 = require("../utils/department");
const admin_model_1 = require("../models/admin.model");
const worker_model_1 = require("../models/worker.model");
const duplicateDetection_service_1 = require("../services/duplicateDetection.service");
const issueVote_model_1 = require("../models/issueVote.model");
const notification_controller_1 = require("./notification.controller");
const audit_service_1 = require("../services/audit.service");
const trustScore_service_1 = require("../services/trustScore.service");
const createIssue = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const files = req.files || [];
        const { title = "Untitled", description, location, issueType, severity } = req.body;
        let parsedLocation = location;
        if (typeof location === "string") {
            try {
                parsedLocation = JSON.parse(location);
            }
            catch (_a) {
                res.status(400).json({ message: "Invalid location JSON format" });
                return;
            }
        }
        if (!title || !description || !parsedLocation || !parsedLocation.latitude || !parsedLocation.longitude || !issueType) {
            res.status(400).json({ message: "Please fill all the required fields" });
            return;
        }
        // Duplicate detection (PART 11: Cluster Intelligence)
        const nearbyIssues = yield (0, duplicateDetection_service_1.findNearbySimilarIssue)(parsedLocation.latitude, parsedLocation.longitude, issueType);
        if (nearbyIssues && nearbyIssues.length > 0) {
            res.status(409).json({
                message: "Duplicate Cluster Detected",
                suggestion: "This issue has already been reported nearby by other citizens.",
                duplicates: nearbyIssues.map(i => ({ id: i._id, title: i.title }))
            });
            return;
        }
        const existingIssue = yield issue_model_1.IssueModel.findOne({ title });
        if (existingIssue) {
            res.status(400).json({ message: "Issue with this title already exists" });
            return;
        }
        // Automatic Department Routing
        const deptString = (0, department_1.getDepartmentForIssueCategory)(issueType);
        let deptId = null;
        if (deptString) {
            let deptDoc = yield department_model_1.DepartmentModel.findOne({ name: deptString });
            if (!deptDoc) {
                // Create auto if missing for demo/ease
                deptDoc = yield department_model_1.DepartmentModel.create({ name: deptString });
            }
            deptId = deptDoc._id;
        }
        // SLA Deadline
        const deadlineTimestamp = (0, department_1.calculateSlaDeadline)(issueType);
        const issue = yield issue_model_1.IssueModel.create({
            citizenId: req.citizenId,
            issueType,
            severity: severity || "Low",
            title,
            description,
            location: parsedLocation,
            geoJSON: {
                type: "Point",
                coordinates: [parsedLocation.longitude, parsedLocation.latitude]
            },
            status: "SUBMITTED",
            workflowStage: "SUBMITTED",
            assignedDepartment: deptId,
            deadlineTimestamp,
            dangerMetrics: req.body.dangerMetrics || undefined,
        });
        const mediaDocs = yield Promise.all(files.map((file) => multimedia_model_1.MultimediaModel.create({
            issueID: issue._id,
            fileType: file.mimetype.startsWith("video") ? "video" : "image",
            url: file.path,
            filename: file.originalname,
        })));
        res.status(200).json({ message: "Issue created", issue, media: mediaDocs });
    }
    catch (error) {
        console.error("Error creating issue:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});
exports.createIssue = createIssue;
const getIssues = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let matchQuery = {};
        const adminId = req.adminId; // If called by Admin
        if (adminId) {
            const adminReq = yield admin_model_1.AdminModel.findById(adminId).lean();
            if (adminReq) {
                // RBAC check: Main admins see all, Dept Admins see only their Dept categories
                if (adminReq.role !== "MAIN_ADMIN") {
                    const allowedCategories = (0, department_1.getCategoriesForDepartment)(adminReq.department);
                    if (allowedCategories.length > 0) {
                        matchQuery.issueType = { $in: allowedCategories };
                    }
                }
            }
        }
        const issues = yield issue_model_1.IssueModel.find(matchQuery)
            .populate("citizenId", "fullName email")
            .populate("assignedDepartment", "name")
            .populate("departmentAdminAssignedBy", "fullName email")
            .populate("workerAssignedToFix", "fullName")
            .sort({ severity: 1, upvotes: -1 })
            .lean();
        const issuesWithMedia = yield Promise.all(issues.map((issue) => __awaiter(void 0, void 0, void 0, function* () {
            var _a;
            const media = yield multimedia_model_1.MultimediaModel.find({ issueID: issue._id });
            return Object.assign(Object.assign({}, issue), { reportedBy: ((_a = issue.citizenId) === null || _a === void 0 ? void 0 : _a.fullName) || "Anonymous", image: media.length > 0 ? media[0].url : null, media: media.map(m => m.url) });
        })));
        res.json({ issues: issuesWithMedia });
    }
    catch (err) {
        console.error("Error fetching issues:", err);
        res.status(500).json({ message: "Something went wrong" });
    }
});
exports.getIssues = getIssues;
const upvoteIssue = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const citizenId = req.citizenId;
        if (!citizenId) {
            res.status(401).json({ message: "Unauthorized. Only citizens can upvote." });
            return;
        }
        const issue = yield issue_model_1.IssueModel.findById(id);
        if (!issue) {
            res.status(404).json({ message: "Issue not found" });
            return;
        }
        if (issue.upvotes && issue.upvotes.includes(citizenId)) {
            res.status(400).json({ message: "You have already upvoted this issue" });
            return;
        }
        issue.upvotes = issue.upvotes || [];
        issue.upvotes.push(citizenId);
        // Auto-escalation threshold
        if (issue.upvotes.length > 50 && issue.severity !== "Critical") {
            issue.severity = "Critical";
            issue.emergencyEscalation = true;
        }
        yield issue.save();
        res.json({ message: "Issue upvoted", upvotes: issue.upvotes.length });
    }
    catch (error) {
        console.error("Error upvoting issue:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});
exports.upvoteIssue = upvoteIssue;
const voteIssue = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { weight } = req.body;
        const citizenId = req.citizenId;
        if (!citizenId) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const vote = yield issueVote_model_1.IssueVoteModel.findOneAndUpdate({ userId: citizenId, issueId: id }, { voteWeight: weight || 1, timestamp: new Date() }, { upsert: true, new: true });
        // Sync upvotes array for legacy sorting
        yield issue_model_1.IssueModel.findByIdAndUpdate(id, { $addToSet: { upvotes: citizenId } });
        res.status(200).json({ success: true, vote });
    }
    catch (error) {
        console.error("Error voting:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});
exports.voteIssue = voteIssue;
const updateDumpingStage = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { cleanupStage } = req.body;
        const adminId = req.adminId;
        const issue = yield issue_model_1.IssueModel.findById(id);
        if (!issue || issue.issueType !== "Illegal Dumping Sites") {
            res.status(400).json({ message: "Invalid issue for dumping stage updates" });
            return;
        }
        const oldStage = issue.cleanupStage;
        issue.cleanupStage = cleanupStage;
        const oldStatus = issue.status;
        if (cleanupStage === "Verified") {
            issue.status = "Closed";
        }
        else if (cleanupStage === "Cleared") {
            issue.status = "Resolved (Unverified)";
        }
        yield issue.save();
        if (issue.citizenId) {
            yield (0, trustScore_service_1.updateCitizenTrustScore)(issue.citizenId.toString());
        }
        yield (0, audit_service_1.logAction)({
            actorId: adminId || req.workerId,
            actorRole: adminId ? "ADMIN" : "WORKER",
            actionType: "STATUS_CHANGE",
            targetEntity: "ISSUE",
            targetId: issue._id,
            oldValue: { stage: oldStage, status: oldStatus },
            newValue: { stage: cleanupStage, status: issue.status },
            ipAddress: req.ip
        });
        res.json({ message: "Dumping stage updated", issue });
    }
    catch (error) {
        console.error("Error updating dumping stage:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});
exports.updateDumpingStage = updateDumpingStage;
const getPublicAnalytics = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const totalIssues = yield issue_model_1.IssueModel.countDocuments();
        const resolvedIssues = yield issue_model_1.IssueModel.countDocuments({ status: { $in: ["Resolved", "Resolved (Unverified)", "Closed"] } });
        const inProgressIssues = yield issue_model_1.IssueModel.countDocuments({ status: { $in: ["In Progress", "Worker Assigned"] } });
        const byType = yield issue_model_1.IssueModel.aggregate([
            { $group: { _id: "$issueType", count: { $sum: 1 } } }
        ]);
        res.status(200).json({
            success: true,
            stats: {
                totalIssues,
                resolvedIssues,
                inProgressIssues,
                byType
            }
        });
    }
    catch (error) {
        console.error("Error fetching public analytics:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
});
exports.getPublicAnalytics = getPublicAnalytics;
const assignWorker = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { workerId, departmentId } = req.body;
        const adminId = req.adminId;
        const adminReq = yield admin_model_1.AdminModel.findById(adminId);
        if (!adminReq || adminReq.role !== "DEPARTMENT_ADMIN") {
            res.status(403).json({ message: "Forbidden: Only Department Admins can assign workers." });
            return;
        }
        const worker = yield worker_model_1.WorkerModel.findById(workerId);
        // Assuming adminReq.department is a string that might represent the ObjectID or the department name. We'll toString() all logic.
        if (!worker || worker.department.toString() !== departmentId) {
            res.status(400).json({ message: "Worker does not belong to the selected department." });
            return;
        }
        const issue = yield issue_model_1.IssueModel.findById(id);
        if (!issue) {
            res.status(404).json({ message: "Issue not found" });
            return;
        }
        if (issue.status === "COMPLETED" || issue.status === "CANCELLED" || issue.status === "Resolved" || issue.status === "Closed") {
            res.status(400).json({ message: "Cannot assign worker to completed or cancelled issue." });
            return;
        }
        if (issue.workerAssignedToFix) {
            res.status(400).json({ message: "Worker already assigned. Use reassign to change worker." });
            return;
        }
        const oldWorker = issue.workerAssignedToFix;
        issue.workerAssignedToFix = workerId;
        issue.assignedDepartment = worker.department;
        issue.departmentAdminAssignedBy = adminId;
        issue.workerAssignmentTimestamp = new Date();
        // Work must begin within 48 hours
        issue.deadlineTimestamp = new Date(Date.now() + 48 * 60 * 60 * 1000);
        if (!issue.timeline) {
            issue.timeline = { reportedAt: new Date(), isOverdue: false };
        }
        issue.timeline.assignedAt = new Date();
        const oldStatus = issue.status;
        issue.status = "ASSIGNED_TO_WORKER";
        issue.workflowStage = "ASSIGNED_TO_WORKER";
        yield issue.save();
        // log IssueStatusHistory entry
        const { IssueStatusHistoryModel } = yield Promise.resolve().then(() => __importStar(require("../models/issueStatusHistory.model")));
        yield IssueStatusHistoryModel.create({
            issueID: issue._id,
            status: "ASSIGNED_TO_WORKER",
            changedBy: adminId,
        });
        yield (0, audit_service_1.logAction)({
            actorId: adminId,
            actorRole: "ADMIN",
            actionType: "ASSIGNMENT",
            targetEntity: "ISSUE",
            targetId: issue._id,
            oldValue: { workerId: oldWorker, status: oldStatus },
            newValue: { workerId, status: "ASSIGNED_TO_WORKER", workflowStage: "ASSIGNED_TO_WORKER" },
            ipAddress: req.ip
        });
        // PART 11: Notification triggers. NOTE: sendTargetedNotification handles email, socket and doc trigger automatically
        yield (0, notification_controller_1.sendTargetedNotification)(workerId, "New Assignment", `You have been assigned to issue ${issue.title}`, "assignment");
        if (issue.citizenId) {
            yield (0, notification_controller_1.sendTargetedNotification)(issue.citizenId.toString(), "Worker Assigned", `A worker has been assigned to fix your reported issue: ${issue.title}`, "status_update");
        }
        res.status(200).json(issue);
    }
    catch (error) {
        console.error("Error assigning worker:", error);
        res.status(500).json({ message: "Failed to assign worker" });
    }
});
exports.assignWorker = assignWorker;
const assignDepartmentAdmin = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { adminId, departmentId } = req.body;
        const mainAdminId = req.adminId;
        const issue = yield issue_model_1.IssueModel.findById(id);
        if (!issue) {
            res.status(404).json({ message: "Issue not found" });
            return;
        }
        issue.departmentAdminAssignedBy = adminId;
        issue.assignedDepartment = departmentId;
        issue.deadlineTimestamp = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24hr to assign worker
        if (!issue.timeline) {
            issue.timeline = { reportedAt: new Date(), isOverdue: false };
        }
        issue.timeline.assignedAt = new Date();
        issue.status = "Pending"; // Or specialized status
        yield issue.save();
        // Notification for Dept Admin
        yield (0, notification_controller_1.sendTargetedNotification)(adminId, "Issue Assignment", `Main Admin assigned you an issue for department supervision.`, "assignment");
        res.status(200).json(issue);
    }
    catch (error) {
        console.error("Error assigning dept admin:", error);
        res.status(500).json({ message: "Failed to assign department admin" });
    }
});
exports.assignDepartmentAdmin = assignDepartmentAdmin;
const getIssueTrackingStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const issue = yield issue_model_1.IssueModel.findById(req.params.id)
            .populate("assignedDepartment", "name")
            .populate("departmentAdminAssignedBy", "fullName lastName")
            .populate("workerAssignedToFix", "fullName lastName")
            .lean();
        if (!issue) {
            res.status(404).json({ message: "Not found" });
            return;
        }
        const progressMap = {
            'Reported': 10,
            'Worker Assigned': 30,
            'In Progress': 60,
            'Resolved (Unverified)': 85,
            'Resolved': 100,
            'Closed': 100
        };
        res.status(200).json({
            timeline: issue.timeline,
            department: issue.assignedDepartment,
            departmentAdmin: issue.departmentAdminAssignedBy,
            worker: issue.workerAssignedToFix,
            progressPercentage: progressMap[issue.status || ''] || 0,
            expectedCompletionDate: issue.deadlineTimestamp,
            isOverdue: (_a = issue.timeline) === null || _a === void 0 ? void 0 : _a.isOverdue,
            violationStage: issue.violationStage,
            delayDuration: issue.delayDuration
        });
    }
    catch (error) {
        console.error("Error fetching tracking:", error);
        res.status(500).json({ message: "Failed to get tracking info" });
    }
});
exports.getIssueTrackingStatus = getIssueTrackingStatus;
const getVotes = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const votes = yield issueVote_model_1.IssueVoteModel.find({ issueId: id }).populate("userId", "fullName");
        res.status(200).json({ success: true, votes });
    }
    catch (error) {
        console.error("Error fetching votes:", error);
        res.status(500).json({ success: false, message: "Fetch failed" });
    }
});
exports.getVotes = getVotes;
const getPublicSchedule = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const issues = yield issue_model_1.IssueModel.find({ status: { $nin: ["Resolved", "Closed", "Rejected"] } })
            .select("title severity escalationLevel timeline createdAt queueType")
            .sort({ escalationLevel: -1, "timeline.reportedAt": 1 })
            .limit(50);
        res.json({ success: true, schedule: issues });
    }
    catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});
exports.getPublicSchedule = getPublicSchedule;
const getServiceOutages = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const issues = yield issue_model_1.IssueModel.find({
            issueType: { $in: ["Power Outage", "Water Supply"] },
            status: { $nin: ["Resolved", "Closed", "Rejected"] }
        })
            .select("title severity timeline createdAt location queueType")
            .sort({ "timeline.reportedAt": -1 });
        res.json({ success: true, outages: issues });
    }
    catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});
exports.getServiceOutages = getServiceOutages;
const acceptAssignment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { id } = req.params;
        const workerId = req.workerId;
        const issue = yield issue_model_1.IssueModel.findById(id);
        if (!issue) {
            res.status(404).json({ message: "Issue not found" });
            return;
        }
        if (((_a = issue.workerAssignedToFix) === null || _a === void 0 ? void 0 : _a.toString()) !== workerId) {
            res.status(403).json({ message: "You are not assigned to this issue" });
            return;
        }
        issue.assignmentAcceptedTimestamp = new Date();
        issue.status = "WORKER_ACCEPTED";
        issue.workflowStage = "WORKER_ACCEPTED";
        if (issue.timeline)
            issue.timeline.workBegunAt = new Date();
        yield issue.save();
        const { IssueStatusHistoryModel } = yield Promise.resolve().then(() => __importStar(require("../models/issueStatusHistory.model")));
        yield IssueStatusHistoryModel.create({
            issueID: issue._id,
            status: "WORKER_ACCEPTED",
            changedBy: workerId,
        });
        if (issue.departmentAdminAssignedBy) {
            yield (0, notification_controller_1.sendTargetedNotification)(issue.departmentAdminAssignedBy.toString(), "Assignment Accepted", `Worker has accepted assignment for issue ${issue.title}`, "Status Update");
        }
        res.status(200).json(issue);
    }
    catch (error) {
        console.error("Error accepting assignment:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});
exports.acceptAssignment = acceptAssignment;
const rejectAssignment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { id } = req.params;
        const workerId = req.workerId;
        const issue = yield issue_model_1.IssueModel.findById(id);
        if (!issue) {
            res.status(404).json({ message: "Issue not found" });
            return;
        }
        if (((_a = issue.workerAssignedToFix) === null || _a === void 0 ? void 0 : _a.toString()) !== workerId) {
            res.status(403).json({ message: "You are not assigned to this issue" });
            return;
        }
        issue.assignmentRejectedTimestamp = new Date();
        issue.workerAssignedToFix = undefined;
        issue.status = "ROUTED_TO_DEPARTMENT";
        issue.workflowStage = "ROUTED_TO_DEPARTMENT";
        yield issue.save();
        const { IssueStatusHistoryModel } = yield Promise.resolve().then(() => __importStar(require("../models/issueStatusHistory.model")));
        yield IssueStatusHistoryModel.create({
            issueID: issue._id,
            status: "ROUTED_TO_DEPARTMENT",
            changedBy: workerId,
        });
        if (issue.departmentAdminAssignedBy) {
            yield (0, notification_controller_1.sendTargetedNotification)(issue.departmentAdminAssignedBy.toString(), "Assignment Rejected", `Worker rejected assignment for issue ${issue.title}`, "Warning");
        }
        res.status(200).json(issue);
    }
    catch (error) {
        console.error("Error rejecting assignment:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});
exports.rejectAssignment = rejectAssignment;
const reassignWorker = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { workerId } = req.body;
        const adminId = req.adminId;
        const issue = yield issue_model_1.IssueModel.findById(id);
        if (!issue) {
            res.status(404).json({ message: "Issue not found" });
            return;
        }
        const worker = yield worker_model_1.WorkerModel.findById(workerId);
        if (!worker) {
            res.status(400).json({ message: "New worker not found" });
            return;
        }
        const oldWorkerId = issue.workerAssignedToFix;
        issue.workerAssignedToFix = workerId;
        issue.assignmentAcceptedTimestamp = undefined;
        issue.status = "ASSIGNED_TO_WORKER";
        issue.workflowStage = "ASSIGNED_TO_WORKER";
        yield issue.save();
        const { IssueStatusHistoryModel } = yield Promise.resolve().then(() => __importStar(require("../models/issueStatusHistory.model")));
        yield IssueStatusHistoryModel.create({
            issueID: issue._id,
            status: "ASSIGNED_TO_WORKER",
            changedBy: adminId,
        });
        if (oldWorkerId) {
            yield (0, notification_controller_1.sendTargetedNotification)(oldWorkerId.toString(), "Unassigned", `You have been unassigned from ${issue.title}`, "Status Update");
        }
        yield (0, notification_controller_1.sendTargetedNotification)(workerId, "New Assignment", `You have been reassigned to issue ${issue.title}`, "assignment");
        res.status(200).json(issue);
    }
    catch (error) {
        console.error("Error reassigning worker:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});
exports.reassignWorker = reassignWorker;
const getAssignmentStats = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const issue = yield issue_model_1.IssueModel.findById(id).populate("workerAssignedToFix").lean();
        if (!issue) {
            res.status(404).json({ message: "Issue not found" });
            return;
        }
        const worker = issue.workerAssignedToFix;
        const workerAvgCompletionTime = worker ? (worker.averageResolutionTimeHours || 0) : 0;
        let adminAvgResponseTimeHours = 0;
        if (issue.departmentAdminAssignedBy) {
            const adminId = issue.departmentAdminAssignedBy;
            // Calculate admin's average response time by finding all their assigned issues
            const assignedIssues = yield issue_model_1.IssueModel.find({
                departmentAdminAssignedBy: adminId,
                "timeline.reportedAt": { $exists: true },
                "timeline.assignedAt": { $exists: true }
            }).select("timeline").lean();
            if (assignedIssues.length > 0) {
                let totalResponseMs = 0;
                let validCount = 0;
                assignedIssues.forEach(iss => {
                    var _a, _b;
                    const rep = ((_a = iss.timeline) === null || _a === void 0 ? void 0 : _a.reportedAt) ? new Date(iss.timeline.reportedAt).getTime() : 0;
                    const assigned = ((_b = iss.timeline) === null || _b === void 0 ? void 0 : _b.assignedAt) ? new Date(iss.timeline.assignedAt).getTime() : 0;
                    if (rep > 0 && assigned > 0 && assigned >= rep) {
                        totalResponseMs += (assigned - rep);
                        validCount++;
                    }
                });
                if (validCount > 0) {
                    const avgMs = totalResponseMs / validCount;
                    adminAvgResponseTimeHours = parseFloat((avgMs / (1000 * 60 * 60)).toFixed(2));
                }
            }
        }
        res.status(200).json({
            success: true,
            stats: {
                adminAvgResponseTimeHours,
                workerAvgCompletionTimeHours: workerAvgCompletionTime,
            }
        });
    }
    catch (error) {
        console.error("Error fetching assignment stats:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});
exports.getAssignmentStats = getAssignmentStats;
const getIssueHistory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let matchQuery = {
            status: { $in: ["Resolved", "Closed", "Resolved (Unverified)", "COMPLETED"] }
        };
        const adminId = req.adminId;
        const citizenId = req.citizenId;
        const workerId = req.workerId;
        if (adminId) {
            const adminReq = yield admin_model_1.AdminModel.findById(adminId).lean();
            if (adminReq) {
                if (adminReq.role !== "MAIN_ADMIN") {
                    const dept = yield department_model_1.DepartmentModel.findOne({ name: adminReq.department }).lean();
                    if (dept) {
                        matchQuery.assignedDepartment = dept._id;
                    }
                    else {
                        // Fallback if department name doesn't match any ID
                        matchQuery.assignedDepartment = new mongoose_1.default.Types.ObjectId();
                    }
                }
                else {
                    const deptId = req.query.departmentId;
                    if (deptId) {
                        if (mongoose_1.default.Types.ObjectId.isValid(deptId)) {
                            matchQuery.assignedDepartment = deptId;
                        }
                        else {
                            const dept = yield department_model_1.DepartmentModel.findOne({ name: deptId }).lean();
                            if (dept)
                                matchQuery.assignedDepartment = dept._id;
                        }
                    }
                }
            }
        }
        else if (citizenId) {
            const deptId = req.query.departmentId;
            if (deptId) {
                if (mongoose_1.default.Types.ObjectId.isValid(deptId)) {
                    matchQuery.assignedDepartment = deptId;
                }
                else {
                    const dept = yield department_model_1.DepartmentModel.findOne({ name: deptId }).lean();
                    if (dept)
                        matchQuery.assignedDepartment = dept._id;
                }
            }
        }
        else if (workerId) {
            matchQuery.workerAssignedToFix = workerId;
        }
        const issues = yield issue_model_1.IssueModel.find(matchQuery)
            .populate("citizenId", "fullName email")
            .populate("assignedDepartment", "name")
            .populate("departmentAdminAssignedBy", "fullName email")
            .populate("workerAssignedToFix", "fullName")
            .sort({ "timeline.resolvedAt": -1, resolutionTimestamp: -1, updatedAt: -1 })
            .lean();
        res.status(200).json({ success: true, history: issues });
    }
    catch (err) {
        console.error("Error fetching issue history:", err);
        res.status(500).json({ message: "Something went wrong" });
    }
});
exports.getIssueHistory = getIssueHistory;
