import { Request, Response } from "express";
import * as DashboardService from "../services/dashboard.service";
import { IssueModel } from "../models/issue.model";
import { AdminModel } from "../models/admin.model";
import { sendPingEmail } from "../services/email.service";

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

export const deletePersonnel = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { role } = req.query;
        const actingAdminId = (req as any).adminId;

        const actingAdmin = await AdminModel.findById(actingAdminId);
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
            const deleted = await AdminModel.findByIdAndDelete(id);
            if (!deleted) {
                res.status(404).json({ success: false, message: "Admin not found" });
                return;
            }
            res.json({ success: true, message: "Department Admin removed permanently" });
        } else if (role === "WORKER") {
            const { WorkerModel } = await import("../models/worker.model");
            const targetWorker = await WorkerModel.findById(id);
            if (!targetWorker) {
                res.status(404).json({ success: false, message: "Worker not found" });
                return;
            }

            // Check department permission for Non-Main Admins
            if (!isMainAdmin && actingAdmin.department !== targetWorker.department) {
                res.status(403).json({ success: false, message: "You can only delete workers in your own department" });
                return;
            }

            await WorkerModel.findByIdAndDelete(id);
            res.json({ success: true, message: "Field Worker removed permanently" });
        } else {
            res.status(400).json({ success: false, message: "Invalid personnel role specified" });
        }
    } catch (err: any) {
        res.status(500).json({ success: false, message: err.message });
    }
};

export const pingWorker = async (req: Request, res: Response): Promise<void> => {
    if (!(await verifyMainAdmin(req, res))) return;
    try {
        const { id } = req.params;
        const issue = await IssueModel.findById(id)
            .populate("workerAssignedToFix");

        if (!issue) {
            res.status(404).json({ success: false, message: "Issue not found" });
            return;
        }

        const emails: string[] = [];

        // 1. Collect worker email
        if (issue.workerAssignedToFix && (issue.workerAssignedToFix as any).email) {
            emails.push((issue.workerAssignedToFix as any).email);
        }

        // 2. Collect department admin emails
        if (issue.assignedDepartment) {
            // Find all department admins for this exact department name
            const admins = await AdminModel.find({
                department: issue.assignedDepartment,
                role: { $in: ["DEPARTMENT_ADMIN", "dept_admin", "admin"] }
            });
            admins.forEach(admin => {
                if (admin.email) emails.push(admin.email);
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

        await sendPingEmail(uniqueEmails, subject, htmlContent);

        res.json({ success: true, message: `Pinged ${uniqueEmails.length} personnel successfully.` });
    } catch (err: any) {
        res.status(500).json({ success: false, message: err.message });
    }
};
