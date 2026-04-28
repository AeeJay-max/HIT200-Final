"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkerModel = void 0;
const mongoose_1 = require("mongoose");
const WorkerSchema = new mongoose_1.Schema({
    fullName: { type: String, required: true },
    email: { type: String, required: true, lowercase: true, unique: true },
    password: { type: String, required: true },
    phonenumber: { type: String, required: true },
    department: { type: String, required: true },
    role: { type: String, enum: ["DEPARTMENT_WORKER"], default: "DEPARTMENT_WORKER" },
    createdBy: { type: mongoose_1.Schema.Types.ObjectId, ref: "Admin", required: true },
    isActive: { type: Boolean, default: true },
    deactivatedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: "Admin" },
    isVerified: { type: Boolean, default: false },
    isEmailVerified: { type: Boolean, default: false },
    pushSubscription: { type: mongoose_1.Schema.Types.Mixed }, // Store Web Push Subscription object
    // Productivity analytics fields
    performanceScore: { type: Number, default: 100 },
    totalIssuesResolved: { type: Number, default: 0 },
    totalOverdueIssues: { type: Number, default: 0 },
    averageResolutionTimeHours: { type: Number, default: 0 },
}, { timestamps: true });
exports.WorkerModel = (0, mongoose_1.model)("Worker", WorkerSchema);
