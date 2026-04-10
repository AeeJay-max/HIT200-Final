import { AuditLogModel } from "../models/auditLog.model";
import { Types } from "mongoose";

export interface LogParams {
    actorId: string | Types.ObjectId;
    actorRole: string;
    actionType: "STATUS_CHANGE" | "ASSIGNMENT" | "MEDIA_DELETED" | "BROADCAST_SENT" | "DEPT_CHANGE" | "WORKER_REASSIGNED";
    targetEntity: "ISSUE" | "NOTIFICATION" | "DEPARTMENT" | "WORKER";
    targetId: string | Types.ObjectId;
    oldValue?: any;
    newValue?: any;
    ipAddress?: string;
}

export const logAction = async (params: LogParams) => {
    try {
        await AuditLogModel.create({
            ...params,
            timestamp: new Date(),
        });
    } catch (error) {
        console.error("Failed to create audit log:", error);
    }
};
