import { Request, Response } from "express";
import * as DashboardService from "../services/dashboard.service";
import { IssueModel } from "../models/issue.model";
import { AdminModel } from "../models/admin.model";

const verifyMainAdmin = async (req: Request, res: Response): Promise<boolean> => {
    const adminId = (req as any).adminId;
    if (!adminId) {
        res.status(401).json({ message: "Unauthorized" });
        return false;
    }
    const admin = await AdminModel.findById(adminId);
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
};

const buildFilters = (req: Request) => {
    const filters: any = {};
    if (req.query.department) filters.assignedDepartment = req.query.department;
    if (req.query.status) filters.status = req.query.status;
    if (req.query.priority) filters.priority = req.query.priority;

    if (req.query.startDate || req.query.endDate) {
        const dateFilter: any = {};
        if (req.query.startDate) dateFilter.$gte = new Date(req.query.startDate as string);
        if (req.query.endDate) {
            const end = new Date(req.query.endDate as string);
            end.setHours(23, 59, 59, 999);
            dateFilter.$lte = end;
        }
        filters.createdAt = dateFilter;
    } else if (req.query.daterange) {
        const days = parseInt(req.query.daterange as string);
        if (!isNaN(days)) {
            const date = new Date();
            date.setDate(date.getDate() - days);
            filters.createdAt = { $gte: date };
        }
    }
    return filters;
};

export const getOverview = async (req: Request, res: Response): Promise<void> => {
    if (!(await verifyMainAdmin(req, res))) return;
    try {
        const data = await DashboardService.getSystemOverview(buildFilters(req));
        res.json({ success: true, data });
    } catch (err: any) { res.status(500).json({ message: err.message }); }
};

export const getEscalations = async (req: Request, res: Response): Promise<void> => {
    if (!(await verifyMainAdmin(req, res))) return;
    try {
        const data = await DashboardService.getEscalationsQueue(buildFilters(req));
        res.json({ success: true, data });
    } catch (err: any) { res.status(500).json({ message: err.message }); }
};

export const getDepartmentPerformance = async (req: Request, res: Response): Promise<void> => {
    if (!(await verifyMainAdmin(req, res))) return;
    try {
        const data = await DashboardService.getDepartmentPerformance(buildFilters(req));
        res.json({ success: true, data });
    } catch (err: any) { res.status(500).json({ message: err.message }); }
};

export const getOverdue = async (req: Request, res: Response): Promise<void> => {
    if (!(await verifyMainAdmin(req, res))) return;
    try {
        const data = await DashboardService.getOverdueTracker(buildFilters(req));
        res.json({ success: true, data });
    } catch (err: any) { res.status(500).json({ message: err.message }); }
};

export const getAnalyticsSummary = async (req: Request, res: Response): Promise<void> => {
    if (!(await verifyMainAdmin(req, res))) return;
    try {
        const data = await DashboardService.getAnalyticsSummary(buildFilters(req));
        res.json({ success: true, data });
    } catch (err: any) { res.status(500).json({ message: err.message }); }
};

export const getMapData = async (req: Request, res: Response): Promise<void> => {
    if (!(await verifyMainAdmin(req, res))) return;
    try {
        const data = await DashboardService.getMapData(buildFilters(req));
        res.json({ success: true, data });
    } catch (err: any) { res.status(500).json({ message: err.message }); }
};

export const getVerification = async (req: Request, res: Response): Promise<void> => {
    if (!(await verifyMainAdmin(req, res))) return;
    try {
        const data = await DashboardService.getVerificationWorkflow(buildFilters(req));
        res.json({ success: true, data });
    } catch (err: any) { res.status(500).json({ message: err.message }); }
};

export const getRecentlyResolved = async (req: Request, res: Response): Promise<void> => {
    if (!(await verifyMainAdmin(req, res))) return;
    try {
        const data = await DashboardService.getRecentlyResolved(buildFilters(req));
        res.json({ success: true, data });
    } catch (err: any) { res.status(500).json({ message: err.message }); }
};

export const getSystemHealth = async (req: Request, res: Response): Promise<void> => {
    if (!(await verifyMainAdmin(req, res))) return;
    try {
        const data = await DashboardService.getSystemHealth();
        res.json({ success: true, data });
    } catch (err: any) { res.status(500).json({ message: err.message }); }
};

export const getActivityStream = async (req: Request, res: Response): Promise<void> => {
    if (!(await verifyMainAdmin(req, res))) return;
    try {
        const data = await DashboardService.getActivityStream(buildFilters(req));
        res.json({ success: true, data });
    } catch (err: any) { res.status(500).json({ message: err.message }); }
};

export const getPersonnelDirectory = async (req: Request, res: Response): Promise<void> => {
    if (!(await verifyMainAdmin(req, res))) return;
    try {
        const { WorkerModel } = await import("../models/worker.model");
        const { DepartmentModel } = await import("../models/department.model");

        const admins = await AdminModel.find({
            role: { $in: ["DEPARTMENT_ADMIN", "dept_admin", "admin"] }
        }).select("-password").lean();
        const workers = await WorkerModel.find().select("-password").lean();

        const departments = await DepartmentModel.find().lean();
        const deptMap = new Map(departments.map(d => [d._id.toString(), d.name]));

        // Hydrate with issue counts
        const hydratedAdmins = await Promise.all(admins.map(async (admin: any) => {
            // If the admin has a string department name, we count issues for that department
            const assignedIssues = await IssueModel.countDocuments({ assignedDepartment: admin.department, status: { $nin: ["Resolved", "Closed"] } });
            return { ...admin, assignedIssues, type: "ADMIN" };
        }));

        const hydratedWorkers = await Promise.all(workers.map(async (worker: any) => {
            const assignedIssues = await IssueModel.countDocuments({ workerAssignedToFix: worker._id, status: { $nin: ["Resolved", "Closed"] } });
            // Handle possibility of department being an ID
            const deptName = deptMap.get(worker.department?.toString()) || worker.department;
            return { ...worker, department: deptName, assignedIssues, type: "WORKER" };
        }));

        res.json({ success: true, data: { admins: hydratedAdmins, workers: hydratedWorkers } });
    } catch (err: any) { res.status(500).json({ message: err.message }); }
};

export const togglePersonnelStatus = async (req: Request, res: Response): Promise<void> => {
    if (!(await verifyMainAdmin(req, res))) return;
    try {
        const { id } = req.params;
        const { role, active } = req.body;
        const adminId = (req as any).adminId;

        if (role === "DEPARTMENT_ADMIN" || role === "dept_admin" || role === "admin") {
            await AdminModel.findByIdAndUpdate(id, {
                isActive: active,
                deactivatedBy: active ? null : adminId
            });
        } else if (role === "WORKER") {
            const { WorkerModel } = await import("../models/worker.model");
            await WorkerModel.findByIdAndUpdate(id, {
                isActive: active,
                deactivatedBy: active ? null : adminId
            });
        }
        res.json({ success: true, message: `Personnel ${active ? 'activated' : 'deactivated'}` });
    } catch (err: any) { res.status(500).json({ message: err.message }); }
};

