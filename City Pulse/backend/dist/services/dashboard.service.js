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
Object.defineProperty(exports, "__esModule", { value: true });
exports.getActivityStream = exports.getSystemHealth = exports.getRecentlyResolved = exports.getVerificationWorkflow = exports.getMapData = exports.getAnalyticsSummary = exports.getOverdueTracker = exports.getDepartmentPerformance = exports.getEscalationsQueue = exports.getSystemOverview = void 0;
const issue_model_1 = require("../models/issue.model");
const department_model_1 = require("../models/department.model");
const getSystemOverview = (...args_1) => __awaiter(void 0, [...args_1], void 0, function* (filters = {}) {
    const totalIssues = yield issue_model_1.IssueModel.countDocuments(filters);
    const resolvedIssues = yield issue_model_1.IssueModel.countDocuments(Object.assign(Object.assign({}, filters), { status: { $in: ["Resolved", "Closed", "Resolved (Unverified)"] } }));
    const inProgressIssues = yield issue_model_1.IssueModel.countDocuments(Object.assign(Object.assign({}, filters), { status: { $in: ["In Progress", "ASSIGNED_TO_WORKER", "WORKER_ACCEPTED"] } }));
    const unassignedIssues = yield issue_model_1.IssueModel.countDocuments(Object.assign(Object.assign({}, filters), { workflowStage: { $in: ["SUBMITTED", "ROUTED_TO_DEPARTMENT"] } }));
    const awaitingVerificationIssues = yield issue_model_1.IssueModel.countDocuments(Object.assign(Object.assign({}, filters), { status: { $in: ["AWAITING_VERIFICATION", "AWAITING_DEPARTMENT_ADMIN_CONFIRMATION"] } }));
    const countOverduePipeline = yield issue_model_1.IssueModel.aggregate([
        { $match: Object.assign(Object.assign({}, filters), { status: { $nin: ["Resolved", "Closed", "Resolved (Unverified)"] }, deadlineTimestamp: { $lt: new Date() } }) },
        { $count: "count" }
    ]);
    const overdueIssues = countOverduePipeline.length > 0 ? countOverduePipeline[0].count : 0;
    return { totalIssues, unassignedIssues, issuesInProgress: inProgressIssues, awaitingVerificationIssues, resolvedIssues, overdueIssues };
});
exports.getSystemOverview = getSystemOverview;
const getEscalationsQueue = (...args_1) => __awaiter(void 0, [...args_1], void 0, function* (filters = {}) {
    // Phase 6 UI needs: Escalated Issues, SLA Risk, Repeated Delay Departments
    // 1. Escalated Issues
    const escalatedIssues = yield issue_model_1.IssueModel.find(Object.assign(Object.assign({}, filters), { escalationLevel: { $gt: 0 } })).sort({ escalationLevel: -1, updatedAt: -1 });
    // 2. SLA Risk Issues (Deadline < 12 hours away and not resolved)
    const SLA_WARNING_TIME = Date.now() + 12 * 60 * 60 * 1000;
    const slaRiskIssues = yield issue_model_1.IssueModel.find(Object.assign(Object.assign({}, filters), { status: { $nin: ["Resolved", "Closed", "Rejected", "COMPLETED", "Resolved (Unverified)"] }, deadlineTimestamp: { $lt: new Date(SLA_WARNING_TIME), $gt: new Date() } }));
    // 3. Repeated Delay Departments (Aggregated by overdue counts)
    const delayedAggregation = yield issue_model_1.IssueModel.aggregate([
        { $match: Object.assign(Object.assign({}, filters), { status: { $nin: ["Resolved", "Closed"] }, deadlineTimestamp: { $lt: new Date() } }) },
        { $group: { _id: "$assignedDepartment", overdueCount: { $sum: 1 } } },
        { $match: { overdueCount: { $gt: 1 } } },
        { $sort: { overdueCount: -1 } },
        { $limit: 10 }
    ]);
    // Populate the aggregation IDs if possible, or we could just fetch manually. Since aggregation gives ObjectIDs:
    const departments = yield department_model_1.DepartmentModel.find();
    const repeatedDelayDepartments = delayedAggregation.map((ag) => {
        var _a;
        const depStr = ((_a = departments.find((d) => String(d._id) === String(ag._id))) === null || _a === void 0 ? void 0 : _a.name) || ag._id;
        return { department: depStr, overdueCount: ag.overdueCount };
    });
    return {
        escalatedIssues,
        slaRiskIssues,
        repeatedDelayDepartments
    };
});
exports.getEscalationsQueue = getEscalationsQueue;
const getDepartmentPerformance = (...args_1) => __awaiter(void 0, [...args_1], void 0, function* (filters = {}) {
    return yield issue_model_1.IssueModel.aggregate([
        { $match: filters },
        {
            $group: {
                _id: "$assignedDepartment",
                totalIssues: { $sum: 1 },
                activeIssues: { $sum: { $cond: [{ $in: ["$status", ["Resolved", "Closed"]] }, 0, 1] } },
                resolvedIssues: { $sum: { $cond: [{ $in: ["$status", ["Resolved", "Closed"]] }, 1, 0] } },
                overdueIssues: { $sum: { $cond: [{ $lt: ["$deadlineTimestamp", new Date()] }, 1, 0] } },
                totalResolutionTime: {
                    $sum: {
                        $cond: [
                            { $and: [{ $gt: ["$resolutionTimestamp", null] }, { $gt: ["$timeline.reportedAt", null] }] },
                            { $subtract: ["$resolutionTimestamp", "$timeline.reportedAt"] },
                            0
                        ]
                    }
                }
            }
        },
        {
            $lookup: {
                from: "departments",
                localField: "_id",
                foreignField: "_id",
                as: "departmentDetails"
            }
        },
        { $unwind: { path: "$departmentDetails", preserveNullAndEmptyArrays: true } },
        {
            $project: {
                departmentName: { $ifNull: ["$departmentDetails.name", "$_id", "Unassigned"] },
                totalIssues: 1,
                activeIssues: 1,
                resolvedIssues: 1,
                overdueIssues: 1,
                averageResolutionTimeMs: {
                    $cond: [{ $gt: ["$resolvedIssues", 0] }, { $divide: ["$totalResolutionTime", "$resolvedIssues"] }, 0]
                }
            }
        }
    ]);
});
exports.getDepartmentPerformance = getDepartmentPerformance;
const getOverdueTracker = (...args_1) => __awaiter(void 0, [...args_1], void 0, function* (filters = {}) {
    return yield issue_model_1.IssueModel.find(Object.assign(Object.assign({}, filters), { deadlineTimestamp: { $lt: new Date() }, status: { $nin: ["Resolved", "Closed", "Resolved (Unverified)"] } })).populate("workerAssignedToFix").sort({ deadlineTimestamp: 1 });
});
exports.getOverdueTracker = getOverdueTracker;
const getAnalyticsSummary = (...args_1) => __awaiter(void 0, [...args_1], void 0, function* (filters = {}) {
    const issuesPerDepartment = yield (0, exports.getDepartmentPerformance)(filters);
    const commonTypes = yield issue_model_1.IssueModel.aggregate([
        { $match: filters },
        { $group: { _id: "$issueType", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 }
    ]);
    return { issuesPerDepartment, mostCommonIssueType: commonTypes };
});
exports.getAnalyticsSummary = getAnalyticsSummary;
const getMapData = (...args_1) => __awaiter(void 0, [...args_1], void 0, function* (filters = {}) {
    return yield issue_model_1.IssueModel.find(Object.assign(Object.assign({}, filters), { geoJSON: { $exists: true } })).select("geoJSON location status issueType assignedDepartment title");
});
exports.getMapData = getMapData;
const getVerificationWorkflow = (...args_1) => __awaiter(void 0, [...args_1], void 0, function* (filters = {}) {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    // Fulfill Phase 5 strict requirement: UI needs Awaiting, Delayed, Recently, Rejected
    const awaitingVerification = yield issue_model_1.IssueModel.find(Object.assign(Object.assign({}, filters), { status: { $in: ["AWAITING_VERIFICATION", "AWAITING_DEPARTMENT_ADMIN_CONFIRMATION"] }, updatedAt: { $gte: twentyFourHoursAgo } })).populate("workerAssignedToFix");
    const delayedVerification = yield issue_model_1.IssueModel.find(Object.assign(Object.assign({}, filters), { status: { $in: ["AWAITING_VERIFICATION", "AWAITING_DEPARTMENT_ADMIN_CONFIRMATION"] }, updatedAt: { $lt: twentyFourHoursAgo } })).populate("workerAssignedToFix");
    const recentlyVerified = yield issue_model_1.IssueModel.find(Object.assign(Object.assign({}, filters), { status: "Resolved", resolutionTimestamp: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } })).populate("workerAssignedToFix");
    const rejectedVerification = yield issue_model_1.IssueModel.find(Object.assign(Object.assign({}, filters), { status: "Rejected" })).populate("workerAssignedToFix");
    return {
        awaitingVerification,
        delayedVerification,
        recentlyVerified,
        rejectedVerification
    };
});
exports.getVerificationWorkflow = getVerificationWorkflow;
const getRecentlyResolved = (...args_1) => __awaiter(void 0, [...args_1], void 0, function* (filters = {}) {
    return yield issue_model_1.IssueModel.find(Object.assign(Object.assign({}, filters), { status: { $in: ["Resolved", "Closed", "COMPLETED", "Resolved (Unverified)"] } })).populate("workerAssignedToFix").sort({ resolutionTimestamp: -1, updatedAt: -1 }).limit(15);
});
exports.getRecentlyResolved = getRecentlyResolved;
const getSystemHealth = () => __awaiter(void 0, void 0, void 0, function* () {
    // Basic mock logic returning a status aggregation metric simulating infrastructure
    return {
        databaseStatus: "operational",
        socketStatus: "active",
        notificationServiceStatus: "healthy",
        uptime: process.uptime(),
        engines: ["MongoDB", "Express", "Node.js"]
    };
});
exports.getSystemHealth = getSystemHealth;
const getActivityStream = (...args_1) => __awaiter(void 0, [...args_1], void 0, function* (filters = {}) {
    const { IssueStatusHistoryModel } = yield Promise.resolve().then(() => __importStar(require("../models/issueStatusHistory.model")));
    return yield IssueStatusHistoryModel.find()
        .populate("issueID", "title issueType location.address assignedDepartment")
        .populate("handledBy", "fullName role department")
        .sort({ changedAt: -1, createdAt: -1 })
        .limit(40);
});
exports.getActivityStream = getActivityStream;
