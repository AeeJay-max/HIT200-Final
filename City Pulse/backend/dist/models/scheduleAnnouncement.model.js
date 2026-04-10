"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScheduleAnnouncementModel = void 0;
const mongoose_1 = require("mongoose");
const ScheduleAnnouncementSchema = new mongoose_1.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    type: {
        type: String,
        enum: ["Road Maintenance", "Planned Shutdown", "Repair Window", "Service Interruption"],
        required: true,
    },
    affectedAreas: [{ type: String }],
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    createdBy: { type: mongoose_1.Schema.Types.ObjectId, ref: "Admin", required: true },
}, { timestamps: true });
exports.ScheduleAnnouncementModel = (0, mongoose_1.model)("ScheduleAnnouncement", ScheduleAnnouncementSchema);
