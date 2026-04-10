import { Request, Response } from "express";
import { EmergencyBroadcastModel } from "../models/emergencyBroadcast.model";
import { getIO } from "../utils/socket";

export const createEmergencyBroadcast = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const adminId = (req as any).adminId;
        if (!adminId) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }

        const { title, message, priorityLevel, type, expiresAt } = req.body;

        if (!title || !message || !type) {
            res.status(400).json({ message: "Missing required fields" });
            return;
        }

        const broadcast = await EmergencyBroadcastModel.create({
            title,
            message,
            priorityLevel: priorityLevel || "Normal",
            type,
            expiresAt,
            createdBy: adminId,
        });

        // Extract socket instance
        const io = getIO();
        // Broadcast to all connected clients
        io.emit("new_emergency_broadcast", broadcast);

        res.status(201).json({ success: true, broadcast });
    } catch (error) {
        console.error("Error creating emergency broadcast:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

export const getActiveBroadcasts = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const broadcasts = await EmergencyBroadcastModel.find({
            $or: [{ expiresAt: { $gt: new Date() } }, { expiresAt: null }],
        }).sort({ createdAt: -1 });

        res.status(200).json({ success: true, broadcasts });
    } catch (error) {
        res.status(500).json({ message: "Internal Server Error" });
    }
};
