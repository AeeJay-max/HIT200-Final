"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditLogModel = void 0;
const mongoose_1 = require("mongoose");
const AuditLogSchema = new mongoose_1.Schema({
    actorId: { type: mongoose_1.Schema.Types.ObjectId, required: true },
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
    targetId: { type: mongoose_1.Schema.Types.ObjectId, required: true },
    oldValue: mongoose_1.Schema.Types.Mixed,
    newValue: mongoose_1.Schema.Types.Mixed,
    timestamp: { type: Date, default: Date.now },
    ipAddress: String,
}, { timestamps: true });
AuditLogSchema.index({ targetId: 1 });
AuditLogSchema.index({ actorId: 1 });
AuditLogSchema.index({ timestamp: -1 });
exports.AuditLogModel = (0, mongoose_1.model)("AuditLog", AuditLogSchema);
