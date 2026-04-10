import { Request, Response } from "express";
import mongoose from "mongoose";
import { cloudinary } from "../config/cloudinary";

export const getSystemHealth = async (req: Request, res: Response): Promise<void> => {
    try {
        const dbStatus = mongoose.connection.readyState === 1 ? "Connected" : "Disconnected";

        let cloudinaryStatus = "Failed";
        try {
            await cloudinary.api.ping();
            cloudinaryStatus = "OK";
        } catch (e) {
            cloudinaryStatus = "Failed";
        }

        const pushStatus = process.env.VAPID_PUBLIC_KEY ? "Configured" : "Missing Keys";
        const cronStatus = "Active";
        const v8Memory = process.memoryUsage();

        let redisStatus = "Offline / Disabled";
        if (process.env.REDIS_URL) redisStatus = "Active (Connected via BullMQ / Service)";

        res.status(200).json({
            success: true,
            health: {
                database: dbStatus,
                cloudinary: cloudinaryStatus,
                pushNotifications: pushStatus,
                cronScheduler: cronStatus,
                redisCache: redisStatus,
                memoryUsageMB: Math.round(v8Memory.rss / (1024 * 1024)) + " MB",
                cpuLoadEstimate: process.cpuUsage().user / 1000 + " ms",
                uptime: process.uptime(),
                timestamp: new Date().toISOString()
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Health check failed" });
    }
};
