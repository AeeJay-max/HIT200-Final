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
exports.manualEscalationAssign = exports.verifyIssueCompletion = exports.getAllAdmins = exports.getRadiusHotspots = exports.getAnalytics = exports.deleteIssueByAdmin = exports.getHandledIssuesByAdmin = exports.updateIssueStatus = exports.updateAdminProfile = exports.getAdminProfile = void 0;
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
            "Closed",
            "Resolved (Unverified)",
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
            if (adminReq && adminReq.role !== "MAIN_ADMIN") {
                const allowedCategories = getCategoriesForDepartment(adminReq.department);
                if (allowedCategories.length > 0) {
                    matchStage = { $match: { issueType: { $in: allowedCategories } } };
                }
            }
        }
        const { WorkerModel } = yield Promise.resolve().then(() => __importStar(require("../models/worker.model")));
        const { DepartmentModel } = yield Promise.resolve().then(() => __importStar(require("../models/department.model")));
        const basePipeline = Object.keys(matchStage).length > 0 ? [matchStage] : [];
        const totalPipeline = [...basePipeline, { $count: "total" }];
        const totalResult = yield issue_model_1.IssueModel.aggregate(totalPipeline);
        const totalIssues = totalResult.length > 0 ? totalResult[0].total : 0;
        const byStatus = yield issue_model_1.IssueModel.aggregate([...basePipeline, { $group: { _id: "$status", count: { $sum: 1 } } }]);
        const byCategory = yield issue_model_1.IssueModel.aggregate([...basePipeline, { $group: { _id: "$issueType", count: { $sum: 1 } } }]);
        // Geo Intelligence Engine: Hotspots based on coordinates matching
        const hotspots = yield issue_model_1.IssueModel.aggregate([
            ...basePipeline,
            {
                $group: {
                    _id: { lat: "$location.latitude", lng: "$location.longitude", address: "$location.address" },
                    count: { $sum: 1 }
                }
            },
            { $match: { count: { $gt: 1 } } }, // Danger clusters/repeated failures
            { $sort: { count: -1 } },
            { $limit: 100 }
        ]);
        // SLA Compliance
        const slaCompliance = yield issue_model_1.IssueModel.aggregate([
            ...basePipeline,
            {
                $group: {
                    _id: { department: "$assignedDepartment", escalationLevel: "$escalationLevel" },
                    count: { $sum: 1 }
                }
            }
        ]);
        // Worker Productivity
        const workerProductivity = yield WorkerModel.find({})
            .sort({ totalIssuesResolved: -1, averageResolutionTimeHours: 1 })
            .limit(10)
            .select("fullName email totalIssuesResolved totalOverdueIssues averageResolutionTimeHours performanceScore");
        // Department Stats
        const departmentStats = yield DepartmentModel.find({});
        res.status(200).json({
            success: true,
            data: {
                totalIssues,
                byStatus,
                byCategory,
                hotspots,
                slaCompliance,
                workerProductivity,
                departmentStats
            }
        });
    }
    catch (error) {
        console.error("Error fetching analytics:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
});
exports.getAnalytics = getAnalytics;
const getRadiusHotspots = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { lat, lng, radiusKm, timeFilter } = req.body;
        if (lat === undefined || lng === undefined || !radiusKm) {
            res.status(400).json({ message: "lat, lng, and radiusKm are required parameters." });
            return;
        }
        const radiusInRadians = radiusKm / 6378.1; // Earth's radius in km
        let matchStage = {
            geoJSON: {
                $geoWithin: {
                    $centerSphere: [[lng, lat], radiusInRadians] // MongoDB uses [lng, lat]
                }
            }
        };
        if (timeFilter) {
            const date = new Date();
            if (timeFilter === "weekly")
                date.setDate(date.getDate() - 7);
            if (timeFilter === "monthly")
                date.setMonth(date.getMonth() - 1);
            if (timeFilter === "yearly")
                date.setFullYear(date.getFullYear() - 1);
            matchStage.createdAt = { $gte: date };
        }
        const hotspots = yield issue_model_1.IssueModel.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: { lat: "$location.latitude", lng: "$location.longitude", address: "$location.address", issueType: "$issueType" },
                    count: { $sum: 1 }
                }
            },
            { $match: { count: { $gt: 0 } } },
            { $sort: { count: -1 } },
            { $limit: 100 }
        ]);
        res.status(200).json({ success: true, hotspots });
    }
    catch (error) {
        console.error("Error fetching radius hotspots:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
});
exports.getRadiusHotspots = getRadiusHotspots;
const getAllAdmins = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const mainAdminId = req.adminId;
        const mainAdmin = yield admin_model_1.AdminModel.findById(mainAdminId);
        if (!mainAdmin || mainAdmin.role !== "MAIN_ADMIN") {
            res.status(403).json({ message: "Only Main Admins can view all admins." });
            return;
        }
        const admins = yield admin_model_1.AdminModel.find({}).select("-password").lean();
        res.json({ success: true, admins });
    }
    catch (error) {
        console.error("Error fetching all admins:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});
exports.getAllAdmins = getAllAdmins;
const verifyIssueCompletion = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { id } = req.params;
        const { action, notes } = req.body; // action: "Approve" | "Reject"
        const adminId = req.adminId;
        const admin = yield admin_model_1.AdminModel.findById(adminId);
        if (!admin) {
            res.status(404).json({ message: "Admin not found" });
            return;
        }
        const issue = yield issue_model_1.IssueModel.findById(id).populate("assignedDepartment");
        if (!issue) {
            res.status(404).json({ message: "Issue not found" });
            return;
        }
        // Security: Only Department Admin of the same department can verify (or Main Admin)
        if (admin.role === "DEPARTMENT_ADMIN") {
            const deptName = (_a = issue.assignedDepartment) === null || _a === void 0 ? void 0 : _a.name;
            if (admin.department !== deptName) {
                res.status(403).json({ message: "You are not authorized to verify issues for another department." });
                return;
            }
        }
        else if (admin.role !== "MAIN_ADMIN") {
            res.status(403).json({ message: "Unauthorized role" });
            return;
        }
        if (action === "Approve") {
            issue.status = "Resolved";
            issue.workflowStage = "RESOLVED";
            issue.resolutionVerifiedBy = new mongoose_1.default.Types.ObjectId(adminId);
            issue.resolutionVerificationTimestamp = new Date();
            issue.resolutionTimestamp = new Date();
        }
        else {
            // Revert to In Progress
            issue.status = "In Progress";
            issue.workflowStage = "IN_PROGRESS";
        }
        yield issue.save();
        yield issueStatusHistory_model_1.IssueStatusHistoryModel.create({
            issueID: issue._id,
            status: issue.status,
            handledBy: new mongoose_1.default.Types.ObjectId(adminId),
            changedBy: new mongoose_1.default.Types.ObjectId(adminId),
            notes: notes || (action === "Reject" ? "Resolution rejected by admin" : "Resolution approved")
        });
        res.json({ success: true, message: `Issue ${action === "Approve" ? "marked as resolved" : "returned to worker"}`, issue });
    }
    catch (error) {
        console.error("Error verifying completion:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});
exports.verifyIssueCompletion = verifyIssueCompletion;
const manualEscalationAssign = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { departmentId, adminId: deptAdminId } = req.body;
        const mainAdminId = req.adminId;
        const mainAdmin = yield admin_model_1.AdminModel.findById(mainAdminId);
        if (!mainAdmin || mainAdmin.role !== "MAIN_ADMIN") {
            res.status(403).json({ message: "Only Main Admins can manually reassign escalated issues." });
            return;
        }
        const issue = yield issue_model_1.IssueModel.findById(id);
        if (!issue) {
            res.status(404).json({ message: "Issue not found" });
            return;
        }
        issue.assignedDepartment = departmentId;
        if (deptAdminId) {
            issue.departmentAdminAssignedBy = new mongoose_1.default.Types.ObjectId(deptAdminId);
        }
        issue.status = "Pending"; // Return to pending for the new department admin to handle
        issue.escalationLevel = 0; // Reset escalation
        yield issue.save();
        yield issueStatusHistory_model_1.IssueStatusHistoryModel.create({
            issueID: issue._id,
            status: "Pending",
            handledBy: new mongoose_1.default.Types.ObjectId(mainAdminId),
            changedBy: new mongoose_1.default.Types.ObjectId(mainAdminId),
            notes: "Escalated issue manually reassigned by Main Admin"
        });
        res.json({ success: true, message: "Escalated issue reassigned successfully", issue });
    }
    catch (error) {
        console.error("Error in manual escalation assignment:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});
exports.manualEscalationAssign = manualEscalationAssign;
