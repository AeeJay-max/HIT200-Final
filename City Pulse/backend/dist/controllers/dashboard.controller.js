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
exports.pingWorker = exports.deletePersonnel = exports.togglePersonnelStatus = exports.getPersonnelDirectory = exports.getActivityStream = exports.getSystemHealth = exports.getRecentlyResolved = exports.getVerification = exports.getMapData = exports.getAnalyticsSummary = exports.getOverdue = exports.getDepartmentPerformance = exports.getEscalations = exports.getOverview = void 0;
const DashboardService = __importStar(require("../services/dashboard.service"));
const issue_model_1 = require("../models/issue.model");
const admin_model_1 = require("../models/admin.model");
const email_service_1 = require("../services/email.service");
const verifyMainAdmin = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const adminId = req.adminId;
    if (!adminId) {
        res.status(401).json({ message: "Unauthorized" });
        return false;
    }
    const admin = yield admin_model_1.AdminModel.findById(adminId);
    if (!admin) {
        res.status(403).json({ message: "Admin not found" });
        return false;
    }
    const r = String(admin.role).toUpperCase();
    if (r !== "MAIN_ADMIN" && r !== "ADMIN") {
        res.status(403).json({ message: "Forbidden: Main Admin only" });
        return false;
    }
    return true;
});
const buildFilters = (req) => {
    const filters = {};
    if (req.query.department)
        filters.assignedDepartment = req.query.department;
    if (req.query.status)
        filters.status = req.query.status;
    if (req.query.priority)
        filters.priority = req.query.priority;
    if (req.query.startDate || req.query.endDate) {
        const dateFilter = {};
        if (req.query.startDate)
            dateFilter.$gte = new Date(req.query.startDate);
        if (req.query.endDate) {
            const end = new Date(req.query.endDate);
            end.setHours(23, 59, 59, 999);
            dateFilter.$lte = end;
        }
        filters.createdAt = dateFilter;
    }
    else if (req.query.daterange) {
        const days = parseInt(req.query.daterange);
        if (!isNaN(days)) {
            const date = new Date();
            date.setDate(date.getDate() - days);
            filters.createdAt = { $gte: date };
        }
    }
    return filters;
};
const getOverview = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!(yield verifyMainAdmin(req, res)))
        return;
    try {
        const data = yield DashboardService.getSystemOverview(buildFilters(req));
        res.json({ success: true, data });
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
});
exports.getOverview = getOverview;
const getEscalations = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!(yield verifyMainAdmin(req, res)))
        return;
    try {
        const data = yield DashboardService.getEscalationsQueue(buildFilters(req));
        res.json({ success: true, data });
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
});
exports.getEscalations = getEscalations;
const getDepartmentPerformance = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!(yield verifyMainAdmin(req, res)))
        return;
    try {
        const data = yield DashboardService.getDepartmentPerformance(buildFilters(req));
        res.json({ success: true, data });
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
});
exports.getDepartmentPerformance = getDepartmentPerformance;
const getOverdue = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!(yield verifyMainAdmin(req, res)))
        return;
    try {
        const data = yield DashboardService.getOverdueTracker(buildFilters(req));
        res.json({ success: true, data });
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
});
exports.getOverdue = getOverdue;
const getAnalyticsSummary = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!(yield verifyMainAdmin(req, res)))
        return;
    try {
        const data = yield DashboardService.getAnalyticsSummary(buildFilters(req));
        res.json({ success: true, data });
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
});
exports.getAnalyticsSummary = getAnalyticsSummary;
const getMapData = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!(yield verifyMainAdmin(req, res)))
        return;
    try {
        const data = yield DashboardService.getMapData(buildFilters(req));
        res.json({ success: true, data });
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
});
exports.getMapData = getMapData;
const getVerification = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!(yield verifyMainAdmin(req, res)))
        return;
    try {
        const data = yield DashboardService.getVerificationWorkflow(buildFilters(req));
        res.json({ success: true, data });
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
});
exports.getVerification = getVerification;
const getRecentlyResolved = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!(yield verifyMainAdmin(req, res)))
        return;
    try {
        const data = yield DashboardService.getRecentlyResolved(buildFilters(req));
        res.json({ success: true, data });
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
});
exports.getRecentlyResolved = getRecentlyResolved;
const getSystemHealth = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!(yield verifyMainAdmin(req, res)))
        return;
    try {
        const data = yield DashboardService.getSystemHealth();
        res.json({ success: true, data });
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
});
exports.getSystemHealth = getSystemHealth;
const getActivityStream = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!(yield verifyMainAdmin(req, res)))
        return;
    try {
        const data = yield DashboardService.getActivityStream(buildFilters(req));
        res.json({ success: true, data });
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
});
exports.getActivityStream = getActivityStream;
const getPersonnelDirectory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!(yield verifyMainAdmin(req, res)))
        return;
    try {
        const { WorkerModel } = yield Promise.resolve().then(() => __importStar(require("../models/worker.model")));
        const { DepartmentModel } = yield Promise.resolve().then(() => __importStar(require("../models/department.model")));
        const admins = yield admin_model_1.AdminModel.find({
            role: { $in: ["DEPARTMENT_ADMIN", "dept_admin", "admin"] }
        }).select("-password").lean();
        const workers = yield WorkerModel.find().select("-password").lean();
        const departments = yield DepartmentModel.find().lean();
        const deptMap = new Map(departments.map(d => [d._id.toString(), d.name]));
        // Hydrate with issue counts
        const hydratedAdmins = yield Promise.all(admins.map((admin) => __awaiter(void 0, void 0, void 0, function* () {
            // If the admin has a string department name, we count issues for that department
            const assignedIssues = yield issue_model_1.IssueModel.countDocuments({ assignedDepartment: admin.department, status: { $nin: ["Resolved", "Closed"] } });
            return Object.assign(Object.assign({}, admin), { assignedIssues, type: "ADMIN" });
        })));
        const hydratedWorkers = yield Promise.all(workers.map((worker) => __awaiter(void 0, void 0, void 0, function* () {
            var _a;
            const assignedIssues = yield issue_model_1.IssueModel.countDocuments({ workerAssignedToFix: worker._id, status: { $nin: ["Resolved", "Closed"] } });
            // Handle possibility of department being an ID
            const deptName = deptMap.get((_a = worker.department) === null || _a === void 0 ? void 0 : _a.toString()) || worker.department;
            return Object.assign(Object.assign({}, worker), { department: deptName, assignedIssues, type: "WORKER" });
        })));
        res.json({ success: true, data: { admins: hydratedAdmins, workers: hydratedWorkers } });
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
});
exports.getPersonnelDirectory = getPersonnelDirectory;
const togglePersonnelStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!(yield verifyMainAdmin(req, res)))
        return;
    try {
        const { id } = req.params;
        const { role, active } = req.body;
        const adminId = req.adminId;
        if (role === "DEPARTMENT_ADMIN" || role === "dept_admin" || role === "admin") {
            yield admin_model_1.AdminModel.findByIdAndUpdate(id, {
                isActive: active,
                deactivatedBy: active ? null : adminId
            });
        }
        else if (role === "WORKER") {
            const { WorkerModel } = yield Promise.resolve().then(() => __importStar(require("../models/worker.model")));
            yield WorkerModel.findByIdAndUpdate(id, {
                isActive: active,
                deactivatedBy: active ? null : adminId
            });
        }
        res.json({ success: true, message: `Personnel ${active ? 'activated' : 'deactivated'}` });
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
});
exports.togglePersonnelStatus = togglePersonnelStatus;
const deletePersonnel = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { role } = req.query;
        const actingAdminId = req.adminId;
        const actingAdmin = yield admin_model_1.AdminModel.findById(actingAdminId);
        if (!actingAdmin) {
            res.status(403).json({ success: false, message: "Forbidden" });
            return;
        }
        // Prevent self-deletion
        if (id === actingAdminId) {
            res.status(400).json({ success: false, message: "Self-deletion is prohibited" });
            return;
        }
        const actingRole = String(actingAdmin.role).toUpperCase();
        const isMainAdmin = actingRole === "MAIN_ADMIN" || actingRole === "ADMIN";
        if (role === "DEPARTMENT_ADMIN" || role === "dept_admin" || role === "admin") {
            if (!isMainAdmin) {
                res.status(403).json({ success: false, message: "Only Main Admins can delete Department Admins" });
                return;
            }
            const deleted = yield admin_model_1.AdminModel.findByIdAndDelete(id);
            if (!deleted) {
                res.status(404).json({ success: false, message: "Admin not found" });
                return;
            }
            res.json({ success: true, message: "Department Admin removed permanently" });
        }
        else if (role === "WORKER") {
            const { WorkerModel } = yield Promise.resolve().then(() => __importStar(require("../models/worker.model")));
            const targetWorker = yield WorkerModel.findById(id);
            if (!targetWorker) {
                res.status(404).json({ success: false, message: "Worker not found" });
                return;
            }
            // Check department permission for Non-Main Admins
            if (!isMainAdmin && actingAdmin.department !== targetWorker.department) {
                res.status(403).json({ success: false, message: "You can only delete workers in your own department" });
                return;
            }
            yield WorkerModel.findByIdAndDelete(id);
            res.json({ success: true, message: "Field Worker removed permanently" });
        }
        else {
            res.status(400).json({ success: false, message: "Invalid personnel role specified" });
        }
    }
    catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});
exports.deletePersonnel = deletePersonnel;
const pingWorker = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!(yield verifyMainAdmin(req, res)))
        return;
    try {
        const { id } = req.params;
        const issue = yield issue_model_1.IssueModel.findById(id)
            .populate("workerAssignedToFix");
        if (!issue) {
            res.status(404).json({ success: false, message: "Issue not found" });
            return;
        }
        const emails = [];
        // 1. Collect worker email
        if (issue.workerAssignedToFix && issue.workerAssignedToFix.email) {
            emails.push(issue.workerAssignedToFix.email);
        }
        // 2. Collect department admin emails
        if (issue.assignedDepartment) {
            // Find all department admins for this exact department name
            const admins = yield admin_model_1.AdminModel.find({
                department: issue.assignedDepartment,
                role: { $in: ["DEPARTMENT_ADMIN", "dept_admin", "admin"] }
            });
            admins.forEach(admin => {
                if (admin.email)
                    emails.push(admin.email);
            });
        }
        // Unique emails only
        const uniqueEmails = Array.from(new Set(emails));
        if (uniqueEmails.length === 0) {
            res.status(400).json({ success: false, message: "No recipients found for this ping" });
            return;
        }
        const subject = `🚨 URGENT: SLA Violation - ${issue.title}`;
        const htmlContent = `
            <div style="font-family: sans-serif; padding: 20px; color: #111827;">
                <h2 style="color: #e11d48; border-bottom: 2px solid #e11d48; padding-bottom: 10px;">
                    URGENT: SLA Violation Warning
                </h2>
                <p style="font-size: 16px; margin-top: 20px;">
                    This is an automated notification from the <strong>Main Administration Dashboard</strong>.
                </p>
                <div style="background: #fff1f2; border-left: 4px solid #e11d48; padding: 15px; margin: 20px 0;">
                    <p style="margin: 0; font-weight: bold; color: #9f1239;">Action Required Immediately</p>
                    <p style="margin: 5px 0 0 0;">This issue is to be handled immediately before further action is taken.</p>
                </div>
                <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
                    <tr>
                        <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-weight: bold; width: 120px;">Issue:</td>
                        <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${issue.title}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-weight: bold;">Status:</td>
                        <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #dc2626; font-weight: bold;">OVERDUE</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-weight: bold;">Dept:</td>
                        <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${issue.assignedDepartment}</td>
                    </tr>
                </table>
                <p style="margin-top: 30px; font-size: 14px; color: #6b7280;">- City Pulse Administration</p>
            </div>
        `;
        yield (0, email_service_1.sendPingEmail)(uniqueEmails, subject, htmlContent);
        res.json({ success: true, message: `Pinged ${uniqueEmails.length} personnel successfully.` });
    }
    catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});
exports.pingWorker = pingWorker;
