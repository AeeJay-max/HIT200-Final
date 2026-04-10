import { Schema, model, Document, Types } from "mongoose";

export interface IAuditLog extends Document {
    actorId: Types.ObjectId;
    actorRole: string;
    actionType: "STATUS_CHANGE" | "ASSIGNMENT" | "MEDIA_DELETED" | "BROADCAST_SENT" | "DEPT_CHANGE" | "WORKER_REASSIGNED";
    targetEntity: "ISSUE" | "NOTIFICATION" | "DEPARTMENT" | "WORKER";
    targetId: Types.ObjectId;
    oldValue?: any;
    newValue?: any;
    timestamp: Date;
    ipAddress?: string;
}

const AuditLogSchema = new Schema<IAuditLog>(
    {
        actorId: { type: Schema.Types.ObjectId, required: true },
        actorRole: { type: String, required: true },
        actionType: {
            type: String,
            required: true,
            enum: ["STATUS_CHANGE", "ASSIGNMENT", "MEDIA_DELETED", "BROADCAST_SENT", "DEPT_CHANGE", "WORKER_REASSIGNED"]
        },
        targetEntity: {
            type: String,
            required: true,
            enum: ["ISSUE", "NOTIFICATION", "DEPARTMENT", "WORKER"]
        },
        targetId: { type: Schema.Types.ObjectId, required: true },
        oldValue: Schema.Types.Mixed,
        newValue: Schema.Types.Mixed,
        timestamp: { type: Date, default: Date.now },
        ipAddress: String,
    },
    { timestamps: true }
);

AuditLogSchema.index({ targetId: 1 });
AuditLogSchema.index({ actorId: 1 });
AuditLogSchema.index({ timestamp: -1 });

export const AuditLogModel = model<IAuditLog>("AuditLog", AuditLogSchema);
