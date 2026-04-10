"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DepartmentModel = void 0;
const mongoose_1 = require("mongoose");
const DepartmentSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    averageResponseTimeHours: { type: Number, default: 0 },
    averageAssignmentAcceptanceTimeHours: { type: Number, default: 0 },
    averageResolutionSpeedHours: { type: Number, default: 0 },
    totalOverdueIssues: { type: Number, default: 0 },
    totalEscalationCount: { type: Number, default: 0 },
    totalIssuesHandled: { type: Number, default: 0 },
}, { timestamps: true });
exports.DepartmentModel = (0, mongoose_1.model)("Department", DepartmentSchema);
