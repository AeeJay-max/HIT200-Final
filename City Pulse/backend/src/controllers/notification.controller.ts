import { Request, Response } from "express";
import { NotificationModel } from "../models/notification.model";
import { CitizenModel } from "../models/citizen.model";
import { AdminModel } from "../models/admin.model";
import { WorkerModel } from "../models/worker.model";
import { getIO } from "../utils/socket";
import nodemailer from "nodemailer";
import { logAction } from "../services/audit.service";
import { getTransporter } from "../config/email.config";


export const createNotification = async (req: Request, res: Response): Promise<void> => {
    try {
        const { title, message, type } = req.body;
        const adminId = (req as any).adminId;

        if (!title || !message || !type) {
            res.status(400).json({ success: false, message: "Missing required fields" });
            return;
        }

        const notification = await NotificationModel.create({
            title,
            message,
            type,
            priority: req.body.priority || "Normal",
            linkTo: req.body.linkTo,
            createdBy: adminId,
        });

        // Emit real-time sync event
        const io = getIO();
        io.emit("new_notification", notification);

        // Email integration using Nodemailer
        try {
            // Determine sender email based on the Admin's department
            const admin = await AdminModel.findById(adminId);
            const department = admin?.department || "Main";

            let smtpUser = process.env.SMTP_USER;
            let smtpPass = process.env.SMTP_PASS;

            if (department === "Main") {
                smtpUser = process.env.SMTP_USER_MAIN || "citypulsead@gmail.com";
                smtpPass = process.env.SMTP_PASS_MAIN;
            } else if (department === "Roads") {
                smtpUser = process.env.SMTP_USER_ROADS;
                smtpPass = process.env.SMTP_PASS_ROADS;
            } else if (department === "Water") {
                smtpUser = process.env.SMTP_USER_WATER;
                smtpPass = process.env.SMTP_PASS_WATER;
            } else if (department === "Environment") {
                smtpUser = process.env.SMTP_USER_ENVIRONMENT;
                smtpPass = process.env.SMTP_PASS_ENVIRONMENT;
            }

            // Fallback to default if specific department credentials are not provided
            smtpUser = smtpUser || process.env.SMTP_USER || "citypulsead@gmail.com";
            smtpPass = smtpPass || process.env.SMTP_PASS;

            // Fetch all citizen emails
            const citizens = await CitizenModel.find({}, "email");
            const emails = citizens.map(c => c.email).filter(e => e);

            if (emails.length > 0) {
                if (!smtpUser || !smtpPass) {
                    console.log(`[MOCK EMAIL] From: ${department} (${smtpUser}) | To: ${emails.length} citizens | Title: ${title} | Message: ${message}`);
                } else {
                    // Initialize dynamic transporter for this specific department
                    const transporter = getTransporter({ user: smtpUser, pass: smtpPass });

                    const mailOptions = {
                        from: `"${admin?.fullName || 'CityPulse Admin'}" <${admin?.email || smtpUser}>`,
                        bcc: emails,
                        subject: `CityPulse Alert: ${title}`,
                        text: `${message}\n\n- CityPulse ${department} Administration`,
                        html: `<div><p>${message}</p><br/><p>- CityPulse ${department} Administration</p></div>`,
                    };

                    await transporter.sendMail(mailOptions);
                    console.log(`Successfully sent email alert from ${smtpUser} to ${emails.length} citizens.`);
                }
            } else {
                console.log("No citizens found to email.");
            }
        } catch (emailError) {
            console.error("Error sending emails:", emailError);
            // Don't fail the request if email sending fails
        }

        res.status(201).json({ success: true, notification });
    } catch (error) {
        console.error("Error creating notification:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

import webpush from "web-push";

const vapidKeys = {
    publicKey: "BIhosNvMBwvHorpXnP4Zs5uvTn8RbkqgX7G4bRuPEVeKxbogsy22iNiC4t8to-S6ts8WJ5EjYs_WlN2VBXaJgO0",
    privateKey: "nRXMTyPoHhmmChyNzL1Ps2ObXOC2U48zRUwBG4qM_Yc"
};

webpush.setVapidDetails(
    "mailto:citypulsead@gmail.com",
    vapidKeys.publicKey,
    vapidKeys.privateKey
);

export const sendTargetedNotification = async (userId: string, title: string, message: string, type: string): Promise<void> => {
    try {
        const notification = await NotificationModel.create({
            title,
            message,
            type,
            recipientId: userId,
            priority: "High",
        });

        const io = getIO();
        io.to(userId).emit("new_notification", notification);

        // Attempt Web Push if subscription exists
        const user: any = (await CitizenModel.findById(userId)) || (await AdminModel.findById(userId)) || (await WorkerModel.findById(userId));
        if (user?.pushSubscription) {
            await webpush.sendNotification(user.pushSubscription, JSON.stringify({ title, message, type }));
        }

        console.log(`[Targeted Notification] To: ${userId} | Title: ${title}`);
    } catch (error) {
        console.error("Error sending targeted notification:", error);
    }
};

export const subscribePush = async (req: Request, res: Response): Promise<void> => {
    try {
        const { subscription } = req.body;
        const userId = (req as any).citizenId || (req as any).adminId || (req as any).workerId;

        const Model: any = (req as any).citizenId ? CitizenModel : (req as any).adminId ? AdminModel : WorkerModel;
        await Model.findByIdAndUpdate(userId, { pushSubscription: subscription });

        res.status(200).json({ success: true, message: "Subscribed to push notifications" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Subscription failed" });
    }
};

export const broadcastNotification = async (req: Request, res: Response): Promise<void> => {
    try {
        const { title, message, type, department } = req.body;
        const adminId = (req as any).adminId;

        const notification = await NotificationModel.create({
            title,
            message,
            type: type || "Broadcast",
            createdBy: adminId,
            priority: "Critical",
            deliveryStatus: "pending"
        });

        const io = getIO();
        io.emit("new_notification", notification);

        // Batch send push notifications to all users with subscriptions
        const citizens = await CitizenModel.find({ pushSubscription: { $exists: true } });
        const admins = await AdminModel.find({ pushSubscription: { $exists: true } });

        const allUsers = [...citizens, ...admins];
        const pushPromises = allUsers.map(u =>
            webpush.sendNotification(u.pushSubscription as any, JSON.stringify({ title, message, type: "Broadcast" }))
                .catch(err => console.error("Push failed for user", u._id))
        );

        const pushResults = await Promise.allSettled(pushPromises);
        const failedCount = pushResults.filter(r => r.status === "rejected").length;

        notification.deliveryStatus = failedCount > 0 ? "failed" : "sent";
        await notification.save();

        await logAction({
            actorId: adminId,
            actorRole: "ADMIN",
            actionType: "BROADCAST_SENT",
            targetEntity: "NOTIFICATION",
            targetId: notification._id as string,
            newValue: { title, type: "Broadcast" },
            ipAddress: req.ip
        });

        res.status(201).json({ success: true, notification });
    } catch (error) {
        res.status(500).json({ success: false, message: "Broadcast failed" });
    }
};

export const disasterBroadcast = async (req: Request, res: Response): Promise<void> => {
    try {
        const { title, message } = req.body;
        const adminId = (req as any).adminId;

        const notification = await NotificationModel.create({
            title: `🚨 EMERGENCY: ${title}`,
            message,
            type: "Emergency",
            priority: "Critical",
            createdBy: adminId,
            deliveryStatus: "pending"
        });

        const citizens = await CitizenModel.find({ pushSubscription: { $exists: true } });
        const pushPromises = citizens.map(c =>
            webpush.sendNotification(c.pushSubscription as any, JSON.stringify({ title, message, type: "Emergency" }))
        );

        await Promise.allSettled(pushPromises);
        notification.deliveryStatus = "sent";
        await notification.save();

        res.status(200).json({ success: true, message: "Disaster broadcast sent to all" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed" });
    }
};

export const getNotifications = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as any).citizenId || (req as any).adminId || (req as any).workerId;
        const { type } = req.query;

        const query: any = {
            $or: [
                { recipientId: userId },
                { type: "Broadcast" }
            ]
        };
        if (type && type !== "All") query.type = type;

        const notifications = await NotificationModel.find(query).sort({ createdAt: -1 });

        const unread = notifications.filter(n => !n.isRead);
        const read = notifications.filter(n => n.isRead);
        const priority = notifications.filter(n => n.priority === "Critical" || n.priority === "Urgent");

        res.status(200).json({ success: true, unread, read, priority });
    } catch (error) {
        res.status(500).json({ success: false, message: "Fetch failed" });
    }
};

export const markNotificationRead = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        await NotificationModel.findByIdAndUpdate(id, { isRead: true });
        res.status(200).json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: "Update failed" });
    }
};
