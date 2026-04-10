import { Request, Response } from "express";
import { AdminModel } from "../models/admin.model";
import { IssueModel } from "../models/issue.model";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

interface AuthRequest extends Request {
    adminId?: string;
    userRole?: string;
}

export const signupWorker = async (req: Request, res: Response): Promise<void> => {
    try {
        const { fullName, email, password, phonenumber, department, adminAccessCode } = req.body;
        const existingAdmin = await AdminModel.findOne({ email });
        if (existingAdmin) {
            res.status(400).json({ message: "Worker with this email already exists" });
            return;
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const worker = await AdminModel.create({
            fullName,
            email,
            password: hashedPassword,
            phonenumber,
            department,
            adminAccessCode,
            role: "dept_worker",
        });
        res.status(201).json({ message: "Worker signed up successfully", worker: { _id: worker._id, email: worker.email } });
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};

export const loginWorker = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password } = req.body;
        const worker = await AdminModel.findOne({ email, role: "dept_worker" });
        if (!worker || !(await bcrypt.compare(password, worker.password))) {
            res.status(401).json({ message: "Invalid credentials" });
            return;
        }
        const secret = process.env.JWT_SECRET ? String(process.env.JWT_SECRET) : "fallback_secret";
        const token = jwt.sign({ id: worker._id, role: worker.role }, secret, { expiresIn: "1d" });
        res.json({ message: "Login successful", token, worker: { _id: worker._id, fullName: worker.fullName, email: worker.email, department: worker.department } });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};

export const getDepartmentWorkers = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const workers = await AdminModel.find({ department: id, role: "dept_worker" }).select("-password");
        res.json(workers);
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};

export const assignDepartmentAdmin = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { adminId, department } = req.body;
        const issue = await IssueModel.findByIdAndUpdate(
            id,
            { assignedDeptAdmin: adminId, assignedDepartment: department, status: "Assigned", assignedAt: new Date() },
            { new: true }
        );
        res.json({ message: "Department Admin Assigned", issue });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};

export const assignWorker = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { workerId } = req.body;

        const worker = await AdminModel.findById(workerId);
        if (!worker) {
            res.status(404).json({ message: "Worker not found" });
            return;
        }

        const issue = await IssueModel.findByIdAndUpdate(
            id,
            { assignedWorker: workerId, status: "Scheduled", expectedCompletionDeadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000) },
            { new: true }
        );

        // Add to worker's assigned issues
        await AdminModel.findByIdAndUpdate(workerId, { $push: { assignedIssues: id } });

        res.json({ message: "Worker Assigned", issue });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};

export const getIssueTracking = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const issue = await IssueModel.findById(id)
            .populate("assignedDepartment", "name")
            .populate("assignedDeptAdmin", "fullName email")
            .populate("assignedWorker", "fullName phonenumber");

        if (!issue) {
            res.status(404).json({ message: "Issue not found" });
            return;
        }

        let progress = 10;
        if (issue.status === "Assigned" || issue.status === "Scheduled") progress = 30;
        if (issue.status === "In Progress") progress = 60;
        if (issue.status === "Verified") progress = 85;
        if (issue.status === "Resolved" || issue.status === "Cleared") progress = 100;

        res.json({
            statusTimeline: issue.status,
            assignedDepartment: issue.assignedDepartment,
            assignedDeptAdmin: issue.assignedDeptAdmin,
            assignedWorker: issue.assignedWorker,
            progressPercentage: progress,
            expectedCompletionDate: issue.expectedCompletionDeadline,
            isOverdue: issue.isOverdue
        });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};

export const updateCleanupStage = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { stage } = req.body;
        const issue = await IssueModel.findByIdAndUpdate(id, { status: stage, workStartedAt: stage === "In Progress" ? new Date() : undefined, resolvedAt: stage === "Cleared" ? new Date() : undefined }, { new: true });
        res.json({ message: "Cleanup stage updated", issue });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};

export const getMaintenanceQueue = async (req: Request, res: Response): Promise<void> => {
    try {
        const issues = await IssueModel.find({ status: "Maintenance Queue" }).populate("citizenId", "fullName");
        res.json(issues);
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};
