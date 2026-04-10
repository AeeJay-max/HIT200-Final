"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationModel = void 0;
const mongoose_1 = require("mongoose");
const NotificationSchema = new mongoose_1.Schema({
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: {
        type: String,
        enum: ["Power Outage", "Water Supply", "Road Maintenance", "Other"],
        default: "Other"
    },
    createdBy: { type: mongoose_1.Schema.Types.ObjectId, ref: "Admin", required: true },
}, { timestamps: true });
exports.NotificationModel = (0, mongoose_1.model)("Notification", NotificationSchema);
