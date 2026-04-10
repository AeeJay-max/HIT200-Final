import { Request, Response } from "express";
import { AuditLogModel } from "../models/auditLog.model";

export const getAuditLogs = async (req: Request, res: Response): Promise<void> => {
    try {
        // Main Admin only (this should be checked via requireRole middleware in routes)
        const logs = await AuditLogModel.find()
            .sort({ createdAt: -1 })
            .limit(100);

        res.status(200).json({ success: true, logs });
    } catch (error) {
        console.error("Error fetching audit logs:", error);
        res.status(500).json({ success: false, message: "Internal server error connecting to audit logs" });
    }
};

export const createAuditLog = async (
    actorId: string,
    actorRole: string,
    actionType: string,
    targetEntity: string,
    targetId: string,
    oldValue?: any,
    newValue?: any,
    ipAddress?: string
) => {
    try {
        await AuditLogModel.create({
            actorId,
            actorRole,
            actionType,
            targetEntity,
            targetId,
            oldValue,
            newValue,
            ipAddress
        });
    } catch (error) {
        console.error("Failed to write to audit log:", error);
    }
};
