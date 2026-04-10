"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSchedules = exports.createSchedule = void 0;
const scheduleAnnouncement_model_1 = require("../models/scheduleAnnouncement.model");
const socket_1 = require("../utils/socket");
const createSchedule = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const adminId = req.adminId;
        if (!adminId) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const { title, description, type, affectedAreas, startTime, endTime } = req.body;
        if (!title || !description || !type || !startTime || !endTime) {
            res.status(400).json({ message: "Missing required fields" });
            return;
        }
        const schedule = yield scheduleAnnouncement_model_1.ScheduleAnnouncementModel.create({
            title,
            description,
            type,
            affectedAreas: affectedAreas || [],
            startTime,
            endTime,
            createdBy: adminId,
        });
        const io = (0, socket_1.getIO)();
        io.emit("new_schedule_announcement", schedule);
        res.status(201).json({ success: true, schedule });
    }
    catch (error) {
        console.error("Error creating schedule:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});
exports.createSchedule = createSchedule;
const getSchedules = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Return future and current schedules
        const schedules = yield scheduleAnnouncement_model_1.ScheduleAnnouncementModel.find({
            endTime: { $gte: new Date() }
        }).sort({ startTime: 1 });
        res.status(200).json({ success: true, schedules });
    }
    catch (error) {
        res.status(500).json({ message: "Internal Server Error" });
    }
});
exports.getSchedules = getSchedules;
