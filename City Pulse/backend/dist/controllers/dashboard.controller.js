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
exports.togglePersonnelStatus = exports.getPersonnelDirectory = exports.getActivityStream = exports.getSystemHealth = exports.getRecentlyResolved = exports.getVerification = exports.getMapData = exports.getAnalyticsSummary = exports.getOverdue = exports.getDepartmentPerformance = exports.getEscalations = exports.getOverview = void 0;
const DashboardService = __importStar(require("../services/dashboard.service"));
const issue_model_1 = require("../models/issue.model");
const admin_model_1 = require("../models/admin.model");
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
    if (req.query.daterange) {
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
