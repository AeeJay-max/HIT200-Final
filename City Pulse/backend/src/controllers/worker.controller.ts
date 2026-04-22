import { Request, Response } from "express";
import { WorkerModel } from "../models/worker.model";
import { IssueModel } from "../models/issue.model";
import { IssueStatusHistoryModel } from "../models/issueStatusHistory.model";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { AdminModel } from "../models/admin.model";
import { DepartmentModel } from "../models/department.model";
import mongoose from "mongoose";

// Admin creates worker
export const createWorker = async (req: Request, res: Response): Promise<void> => {
    try {
        const adminId = (req as any).adminId;
        if (!adminId) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }

        const admin = await AdminModel.findById(adminId);
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

        const existingUser = await WorkerModel.findOne({ email });
        if (existingUser) {
            res.status(400).json({ message: "Worker with this email already exists" });
            return;
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const departmentStr = admin.department;

        let deptDoc = await DepartmentModel.findOne({ name: departmentStr });
        if (!deptDoc) {
            deptDoc = await DepartmentModel.create({ name: departmentStr });
        }

        const worker = await WorkerModel.create({
            fullName,
            email,
            password: hashedPassword,
            phonenumber,
            department: deptDoc._id,
            createdBy: admin._id,
            role: "DEPARTMENT_WORKER"
        });

        res.status(201).json({ message: "Worker created successfully", worker });
    } catch (err) {
        console.error("Error creating worker:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const workerLogin = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password } = req.body;
        const worker = await WorkerModel.findOne({ email });
        if (!worker || !worker.password) {
            res.status(401).json({ message: "Invalid credentials" });
            return;
        }

        const isMatch = await bcrypt.compare(password, worker.password);
        if (!isMatch) {
            res.status(401).json({ message: "Invalid credentials" });
            return;
        }

        const token = jwt.sign(
            { id: worker._id, role: "worker" },
            process.env.JWT_PASSWORD!,
            { expiresIn: "1d" }
        );

        res.json({ token, user: worker, message: "Login successful" });
    } catch (err) {
        res.status(500).json({ message: "Internal Server Error" });
    }
};

export const getAssignedIssues = async (req: Request, res: Response): Promise<void> => {
    try {
        const workerId = (req as any).workerId;
        const worker = await WorkerModel.findById(workerId);
        if (!worker) {
            res.status(404).json({ message: "Worker not found" });
            return;
        }

        const issues = await IssueModel.find({
            workerAssignedToFix: worker._id
        }).populate("citizenId", "fullName email")
            .populate("workerAssignedToFix", "fullName");

        res.json({ success: true, issues });
    } catch (err) {
        res.status(500).json({ success: false, message: "Error fetching assigned issues" });
    }
};

// Admin assigning worker to an issue
export const assignWorkerToIssue = async (req: Request, res: Response): Promise<void> => {
    try {
        const { issueId, workerId } = req.body;
        const adminId = (req as any).adminId;

        const issue = await IssueModel.findById(issueId);

        if (!issue) {
            res.status(404).json({ message: "Issue not found" });
            return;
        }

        if (!issue.timeline) {
            issue.timeline = { reportedAt: new Date(), isOverdue: false };
        }
        issue.timeline.assignedAt = new Date();
        issue.workerAssignedToFix = workerId;
        issue.departmentAdminAssignedBy = adminId;
        issue.workerAssignmentTimestamp = new Date();
        issue.status = "Worker Assigned";

        await issue.save();

        await IssueStatusHistoryModel.create({
            issueID: issue._id,
            status: "Worker Assigned",
            changedBy: new mongoose.Types.ObjectId(adminId),
        });

        res.json({ success: true, message: "Worker assigned successfully", issue });
    } catch (err) {
        res.status(500).json({ success: false, message: "Error assigning worker" });
    }
};

export const submitIssueCompletion = async (req: Request, res: Response): Promise<void> => {
    try {
        const { issueId } = req.params;
        const { completionNotes } = req.body;
        const workerId = (req as any).workerId;
        const file = req.file;

        if (!file) {
            res.status(400).json({ message: "Completion image is required" });
            return;
        }

        const issue = await IssueModel.findById(issueId);
        if (!issue) {
            res.status(404).json({ message: "Issue not found" });
            return;
        }

        issue.status = "AWAITING_DEPARTMENT_ADMIN_CONFIRMATION";
        issue.workflowStage = "AWAITING_DEPARTMENT_ADMIN_CONFIRMATION";
        issue.completionMetadata = {
            completionImage: file.path,
            completionTimestamp: new Date(),
            completionNotes
        };

        await issue.save();

        await IssueStatusHistoryModel.create({
            issueID: issue._id,
            status: "AWAITING_DEPARTMENT_ADMIN_CONFIRMATION",
            changedBy: new mongoose.Types.ObjectId(workerId!),
        });

        // Optional: Update worker performance metrics if needed here or on final resolution
        // For now, increment total resolved in anticipation (or wait for admin confirmation?)
        // The user says "Worker resolves issue -> Issue status becomes: AWAITING_DEPARTMENT_ADMIN_CONFIRMATION"
        // I'll update metrics only after Admin verifies to be safe, but let's increment a 'pending' metric if it existed.

        res.json({ success: true, message: "Issue completion submitted for verification", issue });
    } catch (err) {
        console.error("Error submitting issue completion:", err);
        res.status(500).json({ success: false, message: "Error submitting completion" });
    }
};

export const markIssueResolved = async (req: Request, res: Response): Promise<void> => {
    // Keeping this for backward compatibility if needed, but the new flow uses submitIssueCompletion
    try {
        const { issueId } = req.params;
        const workerId = (req as any).workerId;

        const issue = await IssueModel.findByIdAndUpdate(
            issueId,
            {
                status: "Resolved", // Changed from "Resolved (Unverified)" to "Resolved" directly if bypass is needed
                resolutionTimestamp: new Date()
            },
            { new: true }
        );

        if (!issue) {
            res.status(404).json({ message: "Issue not found" });
            return;
        }

        await IssueStatusHistoryModel.create({
            issueID: issue._id,
            status: "Resolved",
            changedBy: new mongoose.Types.ObjectId(workerId!),
        });

        res.json({ success: true, message: "Issue marked as resolved", issue });
    } catch (err) {
        res.status(500).json({ success: false, message: "Error resolving issue" });
    }
};

export const getWorkerProfile = async (req: Request, res: Response): Promise<void> => {
    try {
        const { workerId } = req.params;
        const worker = await WorkerModel.findById(workerId).select("-password").populate("department", "name");
        if (!worker) {
            res.status(404).json({ message: "Worker not found" });
            return;
        }
        res.json(worker);
    } catch (err) {
        res.status(500).json({ message: "Internal Server Error" });
    }
};

export const getWorkersByDepartment = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const workers = await WorkerModel.find({ department: id }).select("-password");
        res.json({ success: true, workers });
    } catch (err) {
        res.status(500).json({ success: false, message: "Error fetching workers" });
    }
};

export const getWorkersForAdminDepartment = async (req: Request, res: Response): Promise<void> => {
    try {
        const adminId = (req as any).adminId;
        if (!adminId) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }

        const admin = await AdminModel.findById(adminId);
        if (!admin || !admin.department) {
            res.status(404).json({ message: "Admin or department not found" });
            return;
        }

        const deptDoc = await DepartmentModel.findOne({ name: admin.department });
        if (!deptDoc) {
            res.json({ success: true, workers: [] });
            return;
        }

        const workers = await WorkerModel.find({ department: deptDoc._id }).select("-password");
        res.json({ success: true, workers });
    } catch (err) {
        console.error("Error fetching admin department workers:", err);
        res.status(500).json({ success: false, message: "Error fetching workers" });
    }
};
