import { model, Schema, Document, Types } from "mongoose";

export interface IAuditLog extends Document {
    actorId: Types.ObjectId;
    actorRole: string;
    actionType: string;
    targetEntity: string;
    targetId: Types.ObjectId;
    oldValue?: any;
    newValue?: any;
    ipAddress?: string;
    createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
    {
        actorId: { type: Schema.Types.ObjectId, required: true },
        actorRole: { type: String, required: true },
        actionType: { type: String, required: true },
        targetEntity: { type: String, required: true },
        targetId: { type: Schema.Types.ObjectId, required: true },
        oldValue: { type: Schema.Types.Mixed },
        newValue: { type: Schema.Types.Mixed },
        ipAddress: { type: String }
    },
    { timestamps: true }
);

export const AuditLogModel = model<IAuditLog>("AuditLog", AuditLogSchema);
