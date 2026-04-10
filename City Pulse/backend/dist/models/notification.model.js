"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationModel = void 0;
const mongoose_1 = require("mongoose");
const NotificationSchema = new mongoose_1.Schema({
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: {
        type: String,
        enum: ["Power Outage", "Water Supply", "Road Maintenance", "Other", "System Alert", "Escalation", "Assignment", "Status Update", "Broadcast", "Warning"],
        default: "Other"
    },
    priority: {
        type: String,
        enum: ["Normal", "Urgent", "Critical"],
        default: "Normal"
    },
    linkTo: { type: String },
    createdBy: { type: mongoose_1.Schema.Types.ObjectId, ref: "Admin" },
    recipientId: { type: mongoose_1.Schema.Types.ObjectId }, // Can ref Citizen, Admin, or Worker
    isRead: { type: Boolean, default: false },
    deliveryStatus: {
        type: String,
        enum: ["sent", "failed", "pending", "retrying"],
        default: "pending"
    },
    retryCount: { type: Number, default: 0 },
}, { timestamps: true });
exports.NotificationModel = (0, mongoose_1.model)("Notification", NotificationSchema);
