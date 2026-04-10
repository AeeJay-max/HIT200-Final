import { Request, Response } from "express";
import { IssueModel } from "../models/issue.model";
import { AdminModel } from "../models/admin.model";
import mongoose from "mongoose";

export const getRadiusAnalytics = async (req: Request, res: Response): Promise<void> => {
    try {
        const { centerLatitude, centerLongitude, radiusKm, startDate, endDate } = req.body;

        const radiusInRadian = parseFloat(radiusKm) / 6378.1; // Earth radius in km

        const query: any = {
            location: {
                $geoWithin: {
                    $centerSphere: [[parseFloat(centerLongitude), parseFloat(centerLatitude)], radiusInRadian]
                }
            }
        };

        if (startDate && endDate) {
            query.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
        }

        const issues = await IssueModel.find(query);

        const typeDistribution = issues.reduce((acc: any, curr) => {
            acc[curr.issueType] = (acc[curr.issueType] || 0) + 1;
            return acc;
        }, {});

        res.json({
            densityCount: issues.length,
            typeDistribution,
            issues
        });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};

export const getDepartmentPerformance = async (req: Request, res: Response): Promise<void> => {
    try {
        const now = new Date();
        const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const currentYearStart = new Date(now.getFullYear(), 0, 1);

        const performance = await IssueModel.aggregate([
            { $match: { assignedDepartment: { $exists: true } } },
            {
                $group: {
                    _id: "$assignedDepartment",
                    totalAssigned: { $sum: 1 },
                    resolvedCount: {
                        $sum: { $cond: [{ $eq: ["$status", "Resolved"] }, 1, 0] }
                    },
                    overdueCount: {
                        $sum: { $cond: [{ $eq: ["$isOverdue", true] }, 1, 0] }
                    },
                    resolvedThisMonth: {
                        $sum: { $cond: [{ $and: [{ $eq: ["$status", "Resolved"] }, { $gte: ["$resolvedAt", currentMonthStart] }] }, 1, 0] }
                    },
                    resolvedThisYear: {
                        $sum: { $cond: [{ $and: [{ $eq: ["$status", "Resolved"] }, { $gte: ["$resolvedAt", currentYearStart] }] }, 1, 0] }
                    },
                    avgResolutionTimeMs: {
                        $avg: { $subtract: ["$resolvedAt", "$createdAt"] }
                    }
                }
            }
        ]);

        res.json(performance);
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};

export const getPublicTransparency = async (req: Request, res: Response): Promise<void> => {
    try {
        const totalIssues = await IssueModel.countDocuments();
        const resolvedIssues = await IssueModel.countDocuments({ status: "Resolved" });
        const overdueIssuesCount = await IssueModel.countDocuments({ isOverdue: true });

        const performance = await IssueModel.aggregate([
            { $match: { status: "Resolved", resolvedAt: { $exists: true } } },
            { $group: { _id: null, avgTotalTime: { $avg: { $subtract: ["$resolvedAt", "$createdAt"] } } } }
        ]);

        // Most affected neighborhoods
        const neighborhoods = await IssueModel.aggregate([
            { $group: { _id: "$location.address", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 }
        ]);

        res.json({
            totalIssues,
            resolvedIssues,
            overdueIssuesCount,
            averageResponseTimeHours: performance.length > 0 ? performance[0].avgTotalTime / (1000 * 60 * 60) : 0,
            mostAffectedNeighborhoods: neighborhoods
        });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};

export const getEscalations = async (req: Request, res: Response): Promise<void> => {
    try {
        const escalations = await IssueModel.aggregate([
            { $match: { escalationPriority: { $in: ["HIGH", "CRITICAL"] } } },
            { $group: { _id: "$escalationPriority", count: { $sum: 1 }, issues: { $push: "$$ROOT" } } }
        ]);
        res.json({ success: true, escalations });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};

export const getWorkerPerformance = async (req: Request, res: Response): Promise<void> => {
    try {
        const performance = await IssueModel.aggregate([
            { $match: { assignedWorker: { $exists: true } } },
            {
                $group: {
                    _id: "$assignedWorker",
                    issuesAssigned: { $sum: 1 },
                    issuesResolved: { $sum: { $cond: [{ $eq: ["$status", "Resolved"] }, 1, 0] } },
                    overdueCasesHandled: { $sum: { $cond: [{ $eq: ["$isOverdue", true] }, 1, 0] } },
                    avgResolutionTimeMs: {
                        $avg: { $subtract: ["$resolvedAt", "$createdAt"] }
                    }
                }
            },
            {
                $lookup: {
                    from: "admins",
                    localField: "_id",
                    foreignField: "_id",
                    as: "worker"
                }
            },
            { $unwind: "$worker" },
            {
                $project: {
                    _id: 1,
                    issuesAssigned: 1,
                    issuesResolved: 1,
                    overdueCasesHandled: 1,
                    avgResolutionTimeMs: 1,
                    performanceRatingScore: {
                        $subtract: [
                            { $multiply: [{ $divide: ["$issuesResolved", { $max: ["$issuesAssigned", 1] }] }, 100] },
                            { $multiply: ["$overdueCasesHandled", 5] }
                        ]
                    },
                    "workerName": "$worker.fullName",
                    "workerDepartment": "$worker.department"
                }
            }
        ]);
        res.json({ success: true, performance });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};

export const getDistrictPerformance = async (req: Request, res: Response): Promise<void> => {
    try {
        const performance = await IssueModel.aggregate([
            {
                $group: {
                    _id: "$location.address",
                    issuesPerDistrict: { $sum: 1 },
                    resolvedCount: { $sum: { $cond: [{ $eq: ["$status", "Resolved"] }, 1, 0] } },
                    overdueCount: { $sum: { $cond: [{ $eq: ["$isOverdue", true] }, 1, 0] } },
                    avgResolutionTimeMs: { $avg: { $subtract: ["$resolvedAt", "$createdAt"] } },
                }
            },
            {
                $project: {
                    _id: 1,
                    issuesPerDistrict: 1,
                    overduePercentage: { $multiply: [{ $divide: ["$overdueCount", { $max: ["$issuesPerDistrict", 1] }] }, 100] },
                    avgResolutionTimeMs: 1
                }
            }
        ]);
        res.json({ success: true, performance });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};

export const getClusters = async (req: Request, res: Response): Promise<void> => {
    try {
        const { IssueClusterModel } = await import("../models/issueCluster.model");
        const clusters = await IssueClusterModel.find().populate("issueIds");
        res.json({ success: true, clusters });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};
