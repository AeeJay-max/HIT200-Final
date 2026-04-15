"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IssueModel = exports.LocationModel = void 0;
const mongoose_1 = require("mongoose");
const locationSchema = new mongoose_1.Schema({
    latitude: { type: Number, required: true, min: -90, max: 90 },
    longitude: { type: Number, required: true, min: -180, max: 180 },
    address: String,
}, { _id: false });
const IssueSchema = new mongoose_1.Schema({
    citizenId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Citizen",
        required: true,
    },
    issueType: {
        type: String,
        enum: [
            "Life-Threatening Potholes",
            "Burst Water Pipes",
            "Sewer Failures",
            "Streetlight Failures",
            "Traffic Light Failures",
            "Illegal Dumping Sites",
            "Water Supply Problems",
            "Electricity Supply Problems",
        ],
        required: true,
    },
    severity: {
        type: String,
        enum: ["Critical", "High", "Medium", "Low"],
        required: true,
        default: "Low"
    },
    title: {
        type: String,
        unique: true,
        required: true,
        maxlength: 100,
        minlength: 5,
    },
    description: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        enum: ["Reported", "In Progress", "Resolved", "Rejected", "Pending", "Escalated", "Worker Assigned", "Resolved (Unverified)", "Closed", "SUBMITTED", "ROUTED_TO_DEPARTMENT", "ASSIGNED_TO_WORKER", "WORKER_ACCEPTED", "AWAITING_VERIFICATION", "COMPLETED", "IN_PROGRESS", "AWAITING_DEPARTMENT_ADMIN_CONFIRMATION"],
        default: "SUBMITTED",
    },
    location: {
        type: locationSchema,
        required: true,
    },
    geoJSON: {
        type: { type: String, enum: ["Point"], default: "Point" },
        coordinates: { type: [Number] } // [lng, lat] - Populated by pre-save hook
    },
    media: [{
            type: mongoose_1.Schema.Types.ObjectId,
            ref: "Multimedia",
        }],
    images: [{
            url: String,
            stage: { type: String, enum: ["Reported", "Before", "After"] }
        }],
    cleanupStage: {
        type: String,
        enum: ["Scheduled", "In Progress", "Cleared", "Verified"]
    },
    dangerMetrics: {
        diameterCm: Number,
        depthCm: Number,
        isOnMainRoad: Boolean,
        autoSeverityScore: Number,
        isLifeThreatening: Boolean,
    },
    timeline: {
        reportedAt: { type: Date, default: Date.now },
        assignedAt: Date,
        workBegunAt: Date,
        resolvedAt: Date,
        isOverdue: { type: Boolean, default: false }
    },
    delayDuration: { type: Number, default: 0 },
    violationStage: { type: String },
    queueType: {
        type: String,
        enum: ["emergency", "maintenance", "general"],
        default: "general"
    },
    duplicateReferenceIssueId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Issue" },
    upvotes: [{ type: mongoose_1.Schema.Types.ObjectId, ref: "Citizen" }],
    aiDuplicateFlag: { type: mongoose_1.Schema.Types.ObjectId, ref: "Issue" },
    emergencyEscalation: { type: Boolean, default: false },
    handledBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Admin",
    },
    assignedDepartment: { type: mongoose_1.Schema.Types.ObjectId, ref: "Department" },
    departmentAdminAssignedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: "Admin" },
    workerAssignedToFix: { type: mongoose_1.Schema.Types.ObjectId, ref: "Worker" },
    assignmentAcceptedTimestamp: { type: Date },
    assignmentRejectedTimestamp: { type: Date },
    workerAssignmentTimestamp: { type: Date },
    deadlineTimestamp: { type: Date },
    resolutionTimestamp: { type: Date },
    escalationLevel: { type: Number, default: 0 },
    escalationPriority: {
        type: String,
        enum: ["Low", "Medium", "High"],
        default: "Low"
    },
    district: { type: String },
    priorityScore: { type: Number, default: 0 },
    completionMetadata: {
        completionImage: String,
        completionTimestamp: Date,
        completionNotes: String,
    },
    resolutionVerifiedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: "Admin" },
    resolutionVerificationTimestamp: { type: Date },
    overdueStatus: { type: Boolean, default: false },
    workflowStage: {
        type: String,
        enum: ["SUBMITTED", "ROUTED_TO_DEPARTMENT", "ASSIGNED_TO_WORKER", "WORKER_ACCEPTED", "IN_PROGRESS", "AWAITING_VERIFICATION", "COMPLETED", "RESOLVED", "AWAITING_DEPARTMENT_ADMIN_CONFIRMATION"],
        default: "SUBMITTED",
    },
    isDeleted: { type: Boolean, default: false },
}, { timestamps: true });
IssueSchema.pre("save", function (next) {
    var _a, _b;
    // PART 2: Pothole Validation & Scoring
    if (this.issueType === "Life-Threatening Potholes" && this.dangerMetrics) {
        const { diameterCm = 0, depthCm = 0, isOnMainRoad = false } = this.dangerMetrics;
        // Severity Score Calculation
        let score = (diameterCm * 1.5) + (depthCm * 2.5);
        if (isOnMainRoad)
            score += 30;
        this.dangerMetrics.autoSeverityScore = score;
        this.dangerMetrics.isLifeThreatening = score >= 60;
        // PART 13: Maintenance vs Emergency Queue
        if (score < 60) {
            // Only force Pending if not already assigned/in-progress
            const initialStages = ["SUBMITTED", "Reported"];
            if (this.status && initialStages.includes(this.status)) {
                this.status = "Pending"; // Maintenance queue triage
            }
        }
        this.queueType = score >= 60 ? "emergency" : "maintenance";
    }
    // PART 12: Emergency Infrastructure Escalation
    const emergencyCategories = ["Traffic Light Failures", "Burst Water Pipes", "Power Outage", "Bridge Damage"];
    if (emergencyCategories.includes(this.issueType)) {
        this.severity = "Critical";
        this.priorityScore = (this.priorityScore || 0) + 100;
    }
    // PART 7: Issue Reputation Priority Score Calculation
    let basePriority = 0;
    switch (this.severity) {
        case "Critical":
            basePriority = 100;
            break;
        case "High":
            basePriority = 50;
            break;
        case "Medium":
            basePriority = 20;
            break;
        default: basePriority = 5;
    }
    const voteWeight = (((_a = this.upvotes) === null || _a === void 0 ? void 0 : _a.length) || 0) * 2;
    const overdueWeight = ((_b = this.timeline) === null || _b === void 0 ? void 0 : _b.isOverdue) ? 40 : 0;
    this.priorityScore = basePriority + voteWeight + overdueWeight;
    // PART 12: Dumping Defaults
    if (this.issueType === "Illegal Dumping Sites" && !this.cleanupStage) {
        this.cleanupStage = "Scheduled";
    }
    next();
});
IssueSchema.pre("validate", function (next) {
    // Sync geoJSON coordinates with location fields
    if (this.location && typeof this.location.longitude === "number" && typeof this.location.latitude === "number") {
        this.geoJSON = {
            type: "Point",
            coordinates: [this.location.longitude, this.location.latitude]
        };
    }
    next();
});
IssueSchema.index({ geoJSON: "2dsphere" });
IssueSchema.index({ deadlineTimestamp: 1 });
IssueSchema.index({ assignedDepartment: 1 });
IssueSchema.index({ severity: 1 });
exports.LocationModel = (0, mongoose_1.model)("Location", locationSchema);
exports.IssueModel = (0, mongoose_1.model)("Issue", IssueSchema);
