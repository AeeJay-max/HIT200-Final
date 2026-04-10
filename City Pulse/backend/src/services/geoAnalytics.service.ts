import { IssueModel } from "../models/issue.model";
import { Types } from "mongoose";

export const get10kmRadiusAnalytics = async (lat: number, lng: number, radiusMeters: number = 10000) => {
    return await IssueModel.aggregate([
        {
            $geoNear: {
                near: { type: "Point", coordinates: [lng, lat] },
                distanceField: "distance",
                maxDistance: 10000,
                spherical: true
            }
        },
        {
            $group: {
                _id: "$issueType",
                count: { $sum: 1 },
                avgSeverity: {
                    $avg: {
                        $switch: {
                            branches: [
                                { case: { $eq: ["$severity", "Critical"] }, then: 4 },
                                { case: { $eq: ["$severity", "High"] }, then: 3 },
                                { case: { $eq: ["$severity", "Medium"] }, then: 2 },
                                { case: { $eq: ["$severity", "Low"] }, then: 1 }
                            ],
                            default: 0
                        }
                    }
                }
            }
        }
    ]);
};

export const getDepartmentPerformance = async () => {
    return await IssueModel.aggregate([
        {
            $match: {
                status: { $in: ["Resolved", "Closed"] },
                createdAt: { $exists: true },
                updatedAt: { $exists: true }
            }
        },
        {
            $group: {
                _id: "$assignedDepartment",
                avgResponseTimeHours: {
                    $avg: {
                        $divide: [
                            { $subtract: ["$updatedAt", "$createdAt"] },
                            3600000
                        ]
                    }
                },
                totalResolved: { $sum: 1 },
                overduePercentage: {
                    $avg: { $cond: ["$timeline.isOverdue", 100, 0] }
                }
            }
        },
        {
            $lookup: {
                from: "departments",
                localField: "_id",
                foreignField: "_id",
                as: "departmentInfo"
            }
        },
        { $unwind: "$departmentInfo" }
    ]);
};

export const getPublicTransparencyStats = async () => {
    const stats = await IssueModel.aggregate([
        {
            $facet: {
                overall: [
                    {
                        $group: {
                            _id: null,
                            avgResponseTime: {
                                $avg: {
                                    $cond: [
                                        { $and: [{ $eq: ["$status", "Resolved"] }, { $exists: ["$updatedAt", true] }] },
                                        { $divide: [{ $subtract: ["$updatedAt", "$createdAt"] }, 3600000] },
                                        null
                                    ]
                                }
                            },
                            totalOverdue: { $sum: { $cond: ["$timeline.isOverdue", 1, 0] } }
                        }
                    }
                ],
                byDistrict: [
                    {
                        $group: {
                            _id: "$location.address", // Simplified for demo, usually parsed district
                            resolved: { $sum: { $cond: [{ $eq: ["$status", "Resolved"] }, 1, 0] } }
                        }
                    }
                ]
            }
        }
    ]);

    return stats[0];
};

export const getDistrictAnalytics = async () => {
    return await IssueModel.aggregate([
        {
            $group: {
                _id: "$district",
                totalIssues: { $sum: 1 },
                resolvedIssues: { $sum: { $cond: [{ $eq: ["$status", "Resolved"] }, 1, 0] } },
                avgPriorityScore: { $avg: "$priorityScore" },
                criticalIssues: { $sum: { $cond: [{ $eq: ["$severity", "Critical"] }, 1, 0] } }
            }
        },
        { $sort: { totalIssues: -1 } }
    ]);
};

export const getWorkerPerformanceById = async (workerId: string) => {
    return await IssueModel.aggregate([
        {
            $match: {
                workerAssignedToFix: new Types.ObjectId(workerId),
                status: { $in: ["Resolved", "Closed"] }
            }
        },
        {
            $group: {
                _id: "$workerAssignedToFix",
                avgResolutionTimeHours: {
                    $avg: {
                        $divide: [
                            { $subtract: ["$resolutionTimestamp", "$workerAssignmentTimestamp"] },
                            3600000
                        ]
                    }
                },
                totalResolved: { $sum: 1 },
                overdueCount: { $sum: { $cond: ["$timeline.isOverdue", 1, 0] } },
                verificationSuccessRate: {
                    $avg: { $cond: [{ $exists: ["$resolutionQualityVerifiedBy", true] }, 100, 0] }
                }
            }
        }
    ]);
};

export const getAllWorkersPerformance = async () => {
    return await IssueModel.aggregate([
        {
            $match: {
                workerAssignedToFix: { $exists: true },
                status: { $in: ["Resolved", "Closed", "Resolved (Unverified)"] },
                resolutionTimestamp: { $exists: true },
                workerAssignmentTimestamp: { $exists: true }
            }
        },
        {
            $group: {
                _id: "$workerAssignedToFix",
                avgResolutionTimeHours: {
                    $avg: {
                        $divide: [
                            { $subtract: ["$resolutionTimestamp", "$workerAssignmentTimestamp"] },
                            3600000
                        ]
                    }
                },
                totalResolved: { $sum: 1 },
                overdueCount: { $sum: { $cond: ["$timeline.isOverdue", 1, 0] } }
            }
        },
        {
            $lookup: {
                from: "workers",
                localField: "_id",
                foreignField: "_id",
                as: "workerInfo"
            }
        },
        { $unwind: { path: "$workerInfo", preserveNullAndEmptyArrays: true } }
    ]);
};
