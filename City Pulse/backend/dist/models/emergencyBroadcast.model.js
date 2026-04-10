"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmergencyBroadcastModel = void 0;
const mongoose_1 = require("mongoose");
const EmergencyBroadcastSchema = new mongoose_1.Schema({
    title: { type: String, required: true },
    message: { type: String, required: true },
    priorityLevel: {
        type: String,
        enum: ["Normal", "Urgent", "Critical"],
        default: "Normal"
    },
    type: {
        type: String,
        enum: ["Road Closure", "Water Shutdown", "Electric Outage", "Public Hazard"],
        required: true
    },
    createdBy: { type: mongoose_1.Schema.Types.ObjectId, ref: "Admin", required: true },
    expiresAt: { type: Date }
}, { timestamps: true });
exports.EmergencyBroadcastModel = (0, mongoose_1.model)("EmergencyBroadcast", EmergencyBroadcastSchema);
