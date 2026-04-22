import mongoose from "mongoose";
import { IssueModel } from "../models/issue.model";
import { DepartmentModel } from "../models/department.model";
import { WorkerModel } from "../models/worker.model";

export const getSystemOverview = async (filters: any = {}) => {
    const totalIssues = await IssueModel.countDocuments(filters);
    const resolvedIssues = await IssueModel.countDocuments({ ...filters, status: { $in: ["Resolved", "Closed", "Resolved (Unverified)"] } });
    const inProgressIssues = await IssueModel.countDocuments({ ...filters, status: { $in: ["In Progress", "ASSIGNED_TO_WORKER", "WORKER_ACCEPTED"] } });
    const unassignedIssues = await IssueModel.countDocuments({ ...filters, workflowStage: { $in: ["SUBMITTED", "ROUTED_TO_DEPARTMENT"] } });
    const awaitingVerificationIssues = await IssueModel.countDocuments({ ...filters, status: { $in: ["AWAITING_VERIFICATION", "AWAITING_DEPARTMENT_ADMIN_CONFIRMATION"] } });
    const countOverduePipeline = await IssueModel.aggregate([
        { $match: { ...filters, status: { $nin: ["Resolved", "Closed", "Resolved (Unverified)"] }, deadlineTimestamp: { $lt: new Date() } } },
        { $count: "count" }
    ]);
    const overdueIssues = countOverduePipeline.length > 0 ? countOverduePipeline[0].count : 0;

    return { totalIssues, unassignedIssues, issuesInProgress: inProgressIssues, awaitingVerificationIssues, resolvedIssues, overdueIssues };
};

export const getEscalationsQueue = async (filters: any = {}) => {
    // Phase 6 UI needs: Escalated Issues, SLA Risk, Repeated Delay Departments

    // 1. Escalated Issues
    const escalatedIssues = await IssueModel.find({
        ...filters,
        escalationLevel: { $gt: 0 }
    }).sort({ escalationLevel: -1, updatedAt: -1 });

    // 2. SLA Risk Issues (Deadline < 12 hours away and not resolved)
    const SLA_WARNING_TIME = Date.now() + 12 * 60 * 60 * 1000;
    const slaRiskIssues = await IssueModel.find({
        ...filters,
        status: { $nin: ["Resolved", "Closed", "Rejected", "COMPLETED", "Resolved (Unverified)"] },
        deadlineTimestamp: { $lt: new Date(SLA_WARNING_TIME), $gt: new Date() }
    });

    // 3. Repeated Delay Departments (Aggregated by overdue counts)
    const delayedAggregation = await IssueModel.aggregate([
        { $match: { ...filters, status: { $nin: ["Resolved", "Closed"] }, deadlineTimestamp: { $lt: new Date() } } },
        { $group: { _id: "$assignedDepartment", overdueCount: { $sum: 1 } } },
        { $match: { overdueCount: { $gt: 1 } } },
        { $sort: { overdueCount: -1 } },
        { $limit: 10 }
    ]);

    // Populate the aggregation IDs if possible, or we could just fetch manually. Since aggregation gives ObjectIDs:
    const departments = await DepartmentModel.find();

    const repeatedDelayDepartments = delayedAggregation.map((ag: any) => {
        const depStr = departments.find((d: any) => String(d._id) === String(ag._id))?.name || ag._id;
        return { department: depStr, overdueCount: ag.overdueCount };
    });

    return {
        escalatedIssues,
        slaRiskIssues,
        repeatedDelayDepartments
    };
};

export const getDepartmentPerformance = async (filters: any = {}) => {
    return await IssueModel.aggregate([
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
};

export const getOverdueTracker = async (filters: any = {}) => {
    return await IssueModel.find({
        ...filters,
        deadlineTimestamp: { $lt: new Date() },
        status: { $nin: ["Resolved", "Closed", "Resolved (Unverified)"] }
    }).populate("workerAssignedToFix").sort({ deadlineTimestamp: 1 });
};

export const getAnalyticsSummary = async (filters: any = {}) => {
    const issuesPerDepartment = await getDepartmentPerformance(filters);
    const commonTypes = await IssueModel.aggregate([
        { $match: filters },
        { $group: { _id: "$issueType", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 }
    ]);
    return { issuesPerDepartment, mostCommonIssueType: commonTypes };
};

export const getMapData = async (filters: any = {}) => {
    return await IssueModel.find({
        ...filters,
        geoJSON: { $exists: true }
    }).select("geoJSON location status issueType assignedDepartment title");
};

export const getVerificationWorkflow = async (filters: any = {}) => {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Fulfill Phase 5 strict requirement: UI needs Awaiting, Delayed, Recently, Rejected
    const awaitingVerification = await IssueModel.find({
        ...filters,
        status: { $in: ["AWAITING_VERIFICATION", "AWAITING_DEPARTMENT_ADMIN_CONFIRMATION"] },
        updatedAt: { $gte: twentyFourHoursAgo }
    }).populate("workerAssignedToFix");

    const delayedVerification = await IssueModel.find({
        ...filters,
        status: { $in: ["AWAITING_VERIFICATION", "AWAITING_DEPARTMENT_ADMIN_CONFIRMATION"] },
        updatedAt: { $lt: twentyFourHoursAgo }
    }).populate("workerAssignedToFix");

    const recentlyVerified = await IssueModel.find({
        ...filters,
        status: "Resolved",
        resolutionTimestamp: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    }).populate("workerAssignedToFix");

    const rejectedVerification = await IssueModel.find({
        ...filters,
        status: "Rejected"
    }).populate("workerAssignedToFix");

    return {
        awaitingVerification,
        delayedVerification,
        recentlyVerified,
        rejectedVerification
    };
};

export const getRecentlyResolved = async (filters: any = {}) => {
    return await IssueModel.find({
        ...filters,
        status: { $in: ["Resolved", "Closed", "COMPLETED", "Resolved (Unverified)"] }
    }).populate("workerAssignedToFix").sort({ resolutionTimestamp: -1, updatedAt: -1 }).limit(15);
};

export const getSystemHealth = async () => {
    // Basic mock logic returning a status aggregation metric simulating infrastructure
    return {
        databaseStatus: "operational",
        socketStatus: "active",
        notificationServiceStatus: "healthy",
        uptime: process.uptime(),
        engines: ["MongoDB", "Express", "Node.js"]
    };
};

export const getActivityStream = async (filters: any = {}) => {
    const { IssueStatusHistoryModel } = await import("../models/issueStatusHistory.model");
    return await IssueStatusHistoryModel.find()
        .populate("issueID", "title issueType location.address assignedDepartment")
        .populate("handledBy", "fullName role department")
        .sort({ changedAt: -1, createdAt: -1 })
        .limit(40);
};
