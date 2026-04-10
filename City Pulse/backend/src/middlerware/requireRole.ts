import { Request, Response, NextFunction } from "express";
import { AdminModel } from "../models/admin.model";

export const requireRole = (allowedRoles: string[]) => {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const adminId = (req as any).adminId;
            const citizenId = (req as any).citizenId;

            if (citizenId && allowedRoles.includes("CITIZEN")) {
                return next();
            }

            if (adminId) {
                const admin = await AdminModel.findById(adminId);
                if (!admin) {
                    res.status(403).json({ success: false, message: "Unauthorized: Admin not found." });
                    return;
                }

                const roleMap: Record<string, string> = {
                    "main_admin": "MAIN_ADMIN",
                    "dept_admin": "DEPARTMENT_ADMIN",
                    "dept_worker": "WORKER"
                };

                const currentRole = roleMap[admin.role];

                if (allowedRoles.includes(currentRole)) {
                    return next();
                }
            }

            res.status(403).json({ success: false, message: "Forbidden: Insufficient privileges." });
        } catch (error) {
            console.error("RBAC Middleware Error:", error);
            res.status(500).json({ success: false, message: "Internal Server Error in RBAC validation." });
        }
    };
};
