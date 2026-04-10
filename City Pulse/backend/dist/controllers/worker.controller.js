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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getWorkerProfile = exports.markIssueResolved = exports.assignWorkerToIssue = exports.getAssignedIssues = exports.workerLogin = exports.createWorker = void 0;
const worker_model_1 = require("../models/worker.model");
const issue_model_1 = require("../models/issue.model");
const issueStatusHistory_model_1 = require("../models/issueStatusHistory.model");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const admin_model_1 = require("../models/admin.model");
const department_model_1 = require("../models/department.model");
const mongoose_1 = __importDefault(require("mongoose"));
// Admin creates worker
const createWorker = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const adminId = req.adminId;
        if (!adminId) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const admin = yield admin_model_1.AdminModel.findById(adminId);
        if (!admin) {
            res.status(404).json({ message: "Admin not found" });
            return;
        }
        if (admin.role !== "DEPARTMENT_ADMIN") {
            res.status(403).json({ message: "Forbidden: Only Department Admins can create Field Worker accounts." });
            return;
        }
        const { fullName, email, password, phonenumber } = req.body;
        if (!fullName || !email || !password || !phonenumber) {
            res.status(400).json({ message: "Missing required fields" });
            return;
        }
        const existingUser = yield worker_model_1.WorkerModel.findOne({ email });
        if (existingUser) {
            res.status(400).json({ message: "Worker with this email already exists" });
            return;
        }
        const hashedPassword = yield bcryptjs_1.default.hash(password, 10);
        const departmentStr = admin.department;
        let deptDoc = yield department_model_1.DepartmentModel.findOne({ name: departmentStr });
        if (!deptDoc) {
            deptDoc = yield department_model_1.DepartmentModel.create({ name: departmentStr });
        }
        const worker = yield worker_model_1.WorkerModel.create({
            fullName,
            email,
            password: hashedPassword,
            phonenumber,
            department: deptDoc._id,
            createdBy: admin._id,
            role: "DEPARTMENT_WORKER"
        });
        res.status(201).json({ message: "Worker created successfully", worker });
    }
    catch (err) {
        console.error("Error creating worker:", err);
        res.status(500).json({ message: "Internal server error" });
    }
});
exports.createWorker = createWorker;
const workerLogin = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password } = req.body;
        const worker = yield worker_model_1.WorkerModel.findOne({ email });
        if (!worker || !worker.password) {
            res.status(401).json({ message: "Invalid credentials" });
            return;
        }
        const isMatch = yield bcryptjs_1.default.compare(password, worker.password);
        if (!isMatch) {
            res.status(401).json({ message: "Invalid credentials" });
            return;
        }
        const token = jsonwebtoken_1.default.sign({ id: worker._id, role: "worker" }, process.env.JWT_PASSWORD, { expiresIn: "1d" });
        res.json({ token, user: worker, message: "Login successful" });
    }
    catch (err) {
        res.status(500).json({ message: "Internal Server Error" });
    }
});
exports.workerLogin = workerLogin;
const getAssignedIssues = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const workerId = req.workerId;
        const worker = yield worker_model_1.WorkerModel.findById(workerId);
        if (!worker) {
            res.status(404).json({ message: "Worker not found" });
            return;
        }
        const issues = yield issue_model_1.IssueModel.find({
            assignedDepartment: worker.department
        }).populate("citizenId", "fullName email")
            .populate("assignedDepartment", "name")
            .populate("workerAssignedToFix", "fullName");
        res.json({ success: true, issues });
    }
    catch (err) {
        res.status(500).json({ success: false, message: "Error fetching assigned issues" });
    }
});
exports.getAssignedIssues = getAssignedIssues;
// Admin assigning worker to an issue
const assignWorkerToIssue = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { issueId, workerId } = req.body;
        const adminId = req.adminId;
        const issue = yield issue_model_1.IssueModel.findByIdAndUpdate(issueId, {
            workerAssignedToFix: workerId,
            departmentAdminAssignedBy: adminId,
            workerAssignmentTimestamp: new Date(),
            status: "Worker Assigned"
        }, { new: true });
        if (!issue) {
            res.status(404).json({ message: "Issue not found" });
            return;
        }
        yield issueStatusHistory_model_1.IssueStatusHistoryModel.create({
            issueID: issue._id,
            status: "Worker Assigned",
            changedBy: new mongoose_1.default.Types.ObjectId(adminId),
        });
        res.json({ success: true, message: "Worker assigned successfully", issue });
    }
    catch (err) {
        res.status(500).json({ success: false, message: "Error assigning worker" });
    }
});
exports.assignWorkerToIssue = assignWorkerToIssue;
const markIssueResolved = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { issueId } = req.params;
        const workerId = req.workerId;
        const issue = yield issue_model_1.IssueModel.findByIdAndUpdate(issueId, {
            status: "Resolved (Unverified)",
            resolutionTimestamp: new Date()
        }, { new: true });
        if (!issue) {
            res.status(404).json({ message: "Issue not found" });
            return;
        }
        yield issueStatusHistory_model_1.IssueStatusHistoryModel.create({
            issueID: issue._id,
            status: "Resolved (Unverified)",
            changedBy: new mongoose_1.default.Types.ObjectId(workerId),
        });
        // We can calculate worker performance immediately or later
        yield worker_model_1.WorkerModel.findByIdAndUpdate(workerId, { $inc: { totalIssuesResolved: 1 } });
        res.json({ success: true, message: "Issue marked as resolved", issue });
    }
    catch (err) {
        res.status(500).json({ success: false, message: "Error resolving issue" });
    }
});
exports.markIssueResolved = markIssueResolved;
const getWorkerProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { workerId } = req.params;
        const worker = yield worker_model_1.WorkerModel.findById(workerId).select("-password").populate("department", "name");
        if (!worker) {
            res.status(404).json({ message: "Worker not found" });
            return;
        }
        res.json(worker);
    }
    catch (err) {
        res.status(500).json({ message: "Internal Server Error" });
    }
});
exports.getWorkerProfile = getWorkerProfile;
