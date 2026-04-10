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
exports.getAnalytics = exports.deleteIssueByAdmin = exports.getHandledIssuesByAdmin = exports.updateIssueStatus = exports.updateAdminProfile = exports.getAdminProfile = void 0;
const admin_model_1 = require("../models/admin.model");
const issue_model_1 = require("../models/issue.model");
const issueStatusHistory_model_1 = require("../models/issueStatusHistory.model");
const mongoose_1 = __importDefault(require("mongoose"));
const getAdminProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const loggedInAdminId = req.adminId;
        if (id !== loggedInAdminId) {
            res.status(403).json({ message: "Unauthorised access" });
            return;
        }
        const admin = yield admin_model_1.AdminModel.findById(id).select("-password").lean();
        if (!admin) {
            res.status(404).json({ message: "Admin not found" });
            return;
        }
        res.json(admin);
    }
    catch (error) {
        console.error("Error fetching admin profile:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});
exports.getAdminProfile = getAdminProfile;
const updateAdminProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { fullName, email, phonenumber, department } = req.body;
        if (!fullName || !email || !phonenumber || !department) {
            res.status(400).json({ message: "All fields are required" });
            return;
        }
        const updatedAdmin = yield admin_model_1.AdminModel.findByIdAndUpdate(id, { fullName, email, phonenumber, department }, { new: true });
        if (!updatedAdmin) {
            res.status(404).json({ message: "Admin not found" });
            return;
        }
        res.json({ message: "Profile updated successfully", user: updatedAdmin });
    }
    catch (error) {
        console.error("Error updating admin profile:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});
exports.updateAdminProfile = updateAdminProfile;
const updateIssueStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const adminId = req.adminId;
        const validStatuses = [
            "Reported",
            "In Progress",
            "Resolved",
            "Rejected",
            "Pending",
        ];
        if (!validStatuses.includes(status)) {
            res.status(400).json({ message: "Invalid status value" });
            return;
        }
        const updatedIssue = yield issue_model_1.IssueModel.findByIdAndUpdate(id, { status }, { new: true });
        if (!updatedIssue) {
            res.status(404).json({ message: "Issue not found" });
            return;
        }
        // Creating a record in IssueStatusHistory for this status change
        yield issueStatusHistory_model_1.IssueStatusHistoryModel.create({
            issueID: new mongoose_1.default.Types.ObjectId(id),
            status,
            handledBy: new mongoose_1.default.Types.ObjectId(adminId),
            changedBy: new mongoose_1.default.Types.ObjectId(adminId), // original reporter, optional
            changedAt: new Date(), // optional if timestamps enabled
        });
        res.json({ message: "Issue updated successfully", issue: updatedIssue });
    }
    catch (error) {
        console.error("Error updating status:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});
exports.updateIssueStatus = updateIssueStatus;
const getHandledIssuesByAdmin = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const authReq = req;
    try {
        const adminId = authReq.adminId; // from authMiddleware
        if (!adminId) {
            res.status(401).json({ success: false, message: "Unauthorized" });
            return;
        }
        const historyRecords = yield issueStatusHistory_model_1.IssueStatusHistoryModel.aggregate([
            {
                $match: {
                    handledBy: new mongoose_1.default.Types.ObjectId(adminId),
                    status: { $in: ["In Progress", "Resolved", "Pending", "Rejected"] },
                },
            },
            {
                $sort: { changedAt: -1 },
            },
            {
                $group: {
                    _id: "$issueID",
                    latestRecord: { $first: "$$ROOT" },
                },
            },
            {
                $replaceRoot: { newRoot: "$latestRecord" },
            },
            {
                $lookup: {
                    from: "issues",
                    localField: "issueID",
                    foreignField: "_id",
                    as: "issueDetails",
                },
            },
            {
                $unwind: "$issueDetails",
            },
            {
                $project: {
                    status: 1,
                    handledBy: 1,
                    lastStatus: "$status",
                    lastUpdated: "$changedAt",
                    issueDetails: 1,
                },
            },
        ]);
        const issues = historyRecords.map((record) => (Object.assign(Object.assign({}, record.issueDetails), { status: record.status, handledBy: record.handledBy, lastStatus: record.lastStatus, lastUpdated: record.lastUpdated, isRejected: record.status === "Rejected" })));
        res.status(200).json({ success: true, issues });
    }
    catch (error) {
        console.error("Error fetching handled issues:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
});
exports.getHandledIssuesByAdmin = getHandledIssuesByAdmin;
const deleteIssueByAdmin = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const loggedInAdminId = req.adminId; // from auth middleware
        const { issueid } = req.params;
        // Validate issueid format
        if (!mongoose_1.default.Types.ObjectId.isValid(issueid)) {
            res.status(400).json({ message: "Invalid issue ID format" });
            return;
        }
        // If allowing any admin to delete:
        const result = yield issue_model_1.IssueModel.deleteOne({ _id: issueid });
        if (result.deletedCount === 0) {
            res.status(404).json({ message: "Issue not found or unauthorized" });
            return;
        }
        res.json({ message: "Deleted Successfully!" });
    }
    catch (error) {
        console.error("Error deleting issue:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});
exports.deleteIssueByAdmin = deleteIssueByAdmin;
const getAnalytics = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const adminId = req.adminId;
        let matchStage = {};
        if (adminId) {
            const { AdminModel } = yield Promise.resolve().then(() => __importStar(require("../models/admin.model")));
            const { getCategoriesForDepartment } = yield Promise.resolve().then(() => __importStar(require("../utils/department")));
            const adminReq = yield AdminModel.findById(adminId).lean();
            if (adminReq) {
                const allowedCategories = getCategoriesForDepartment(adminReq.department);
                if (allowedCategories.length > 0) {
                    matchStage = { $match: { issueType: { $in: allowedCategories } } };
                }
            }
        }
        const basePipeline = Object.keys(matchStage).length > 0 ? [matchStage] : [];
        const totalPipeline = [...basePipeline, { $count: "total" }];
        const totalResult = yield issue_model_1.IssueModel.aggregate(totalPipeline);
        const totalIssues = totalResult.length > 0 ? totalResult[0].total : 0;
        const byStatus = yield issue_model_1.IssueModel.aggregate([
            ...basePipeline,
            { $group: { _id: "$status", count: { $sum: 1 } } }
        ]);
        const byCategory = yield issue_model_1.IssueModel.aggregate([
            ...basePipeline,
            { $group: { _id: "$issueType", count: { $sum: 1 } } }
        ]);
        const hotspots = yield issue_model_1.IssueModel.aggregate([
            ...basePipeline,
            { $group: { _id: "$location.address", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 }
        ]);
        res.status(200).json({
            success: true,
            data: {
                totalIssues,
                byStatus,
                byCategory,
                hotspots
            }
        });
    }
    catch (error) {
        console.error("Error fetching analytics:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
});
exports.getAnalytics = getAnalytics;
