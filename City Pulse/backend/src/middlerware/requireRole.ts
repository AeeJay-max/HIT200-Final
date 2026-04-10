import { Request, Response, NextFunction } from "express";

export type UserRole = "MAIN_ADMIN" | "DEPARTMENT_ADMIN" | "WORKER" | "CITIZEN";

export const requireRole = (allowedRoles: UserRole[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const userRole = (req as any).role as UserRole;

        if (!userRole) {
            res.status(401).json({ message: "Role not found in token" });
            return;
        }

        if (!allowedRoles.includes(userRole)) {
            res.status(403).json({
                message: `Access denied. Required one of: ${allowedRoles.join(", ")}`,
            });
            return;
        }

        next();
    };
};
