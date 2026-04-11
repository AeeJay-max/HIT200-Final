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
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllWorkersPerformance = exports.getWorkerPerformanceById = exports.getDistrictAnalytics = exports.getPublicTransparencyStats = exports.getDepartmentPerformance = exports.get10kmRadiusAnalytics = void 0;
const issue_model_1 = require("../models/issue.model");
const mongoose_1 = require("mongoose");
const get10kmRadiusAnalytics = (lat_1, lng_1, ...args_1) => __awaiter(void 0, [lat_1, lng_1, ...args_1], void 0, function* (lat, lng, radiusMeters = 10000) {
    return yield issue_model_1.IssueModel.aggregate([
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
});
exports.get10kmRadiusAnalytics = get10kmRadiusAnalytics;
const getDepartmentPerformance = () => __awaiter(void 0, void 0, void 0, function* () {
    return yield issue_model_1.IssueModel.aggregate([
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
});
exports.getDepartmentPerformance = getDepartmentPerformance;
const getPublicTransparencyStats = () => __awaiter(void 0, void 0, void 0, function* () {
    const stats = yield issue_model_1.IssueModel.aggregate([
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
});
exports.getPublicTransparencyStats = getPublicTransparencyStats;
const getDistrictAnalytics = () => __awaiter(void 0, void 0, void 0, function* () {
    return yield issue_model_1.IssueModel.aggregate([
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
});
exports.getDistrictAnalytics = getDistrictAnalytics;
const getWorkerPerformanceById = (workerId) => __awaiter(void 0, void 0, void 0, function* () {
    return yield issue_model_1.IssueModel.aggregate([
        {
            $match: {
                workerAssignedToFix: new mongoose_1.Types.ObjectId(workerId),
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
});
exports.getWorkerPerformanceById = getWorkerPerformanceById;
const getAllWorkersPerformance = () => __awaiter(void 0, void 0, void 0, function* () {
    return yield issue_model_1.IssueModel.aggregate([
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
});
exports.getAllWorkersPerformance = getAllWorkersPerformance;
