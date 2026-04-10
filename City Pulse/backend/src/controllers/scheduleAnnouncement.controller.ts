import { Request, Response } from "express";
import { ScheduleAnnouncementModel } from "../models/scheduleAnnouncement.model";
import { getIO } from "../utils/socket";

export const createSchedule = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const adminId = (req as any).adminId;
        if (!adminId) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }

        const { title, description, type, affectedAreas, startTime, endTime } = req.body;

        if (!title || !description || !type || !startTime || !endTime) {
            res.status(400).json({ message: "Missing required fields" });
            return;
        }

        const schedule = await ScheduleAnnouncementModel.create({
            title,
            description,
            type,
            affectedAreas: affectedAreas || [],
            startTime,
            endTime,
            createdBy: adminId,
        });

        const io = getIO();
        io.emit("new_schedule_announcement", schedule);

        res.status(201).json({ success: true, schedule });
    } catch (error) {
        console.error("Error creating schedule:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

export const getSchedules = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        // Return future and current schedules
        const schedules = await ScheduleAnnouncementModel.find({
            endTime: { $gte: new Date() }
        }).sort({ startTime: 1 });

        res.status(200).json({ success: true, schedules });
    } catch (error) {
        res.status(500).json({ message: "Internal Server Error" });
    }
};
