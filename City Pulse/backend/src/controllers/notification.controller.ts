import { Request, Response } from "express";
import { NotificationModel } from "../models/notification.model";
import { CitizenModel } from "../models/citizen.model";
import { AdminModel } from "../models/admin.model";
import { WorkerModel } from "../models/worker.model";
import { getIO } from "../utils/socket";
import nodemailer from "nodemailer";
import { logAction } from "../services/audit.service";
import { getTransporter } from "../config/email.config";
import { sendBulkWhatsAppAlert } from "../services/whatsapp.service";


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
            const admin = await AdminModel.findById(adminId);
            const departmentName = admin?.role === "MAIN_ADMIN" ? "City Hall" : (admin?.department || "General");

            // User specifically requested citypulse402@gmail.com as the sender
            const smtpUser = "citypulse402@gmail.com";
            const smtpPass = process.env.SMTP_PASS; // We expect the user to provide this in .env

            // Fetch all users' emails and phone numbers (Citizens, Admins, Workers)
            const [citizens, admins, workers] = await Promise.all([
                CitizenModel.find({}, "email phonenumber"),
                AdminModel.find({}, "email phonenumber"),
                WorkerModel.find({}, "email phonenumber")
            ]);

            const emails = [
                ...citizens.map(c => c.email),
                ...admins.map(a => a.email),
                ...workers.map(w => w.email)
            ].filter(e => e);

            const phoneNumbers = [
                ...citizens.map(c => c.phonenumber),
                ...admins.map(a => a.phonenumber),
                ...workers.map(w => w.phonenumber)
            ].filter(p => p);

            if (emails.length > 0) {
                if (!smtpPass) {
                    console.log(`[MOCK EMAIL] From: ${smtpUser} | Subject: [${departmentName}] ${title} | To: ${emails.length} citizens`);
                    console.warn("SMTP_PASS is missing in .env. Email not sent.");
                } else {
                    // Initialize transporter with citypulse402@gmail.com
                    const transporter = getTransporter({ user: smtpUser, pass: smtpPass });

                    const mailOptions = {
                        from: `"${departmentName} - City Pulse" <${smtpUser}>`,
                        bcc: emails,
                        subject: `[${departmentName}] ${title}`,
                        text: `${message}\n\nThis is an official alert from the ${departmentName} Department.\n\n- City Pulse Administration`,
                        html: `
                            <div style="font-family: sans-serif; padding: 20px; color: #111827;">
                                <h2 style="color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 10px;">
                                    [${departmentName}] ${title}
                                </h2>
                                <p style="font-size: 16px; line-height: 1.6; margin-top: 20px;">
                                    ${message.replace(/\n/g, "<br/>")}
                                </p>
                                <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 14px; color: #6b7280;">
                                    <p>This is an official city-wide alert from <strong>City Pulse</strong>.</p>
                                    <p>&copy; 2026 City Pulse Administration</p>
                                </div>
                            </div>
                        `,
                    };

                    await transporter.sendMail(mailOptions);
                    console.log(`Successfully sent City-wide Alert from ${smtpUser} to ${emails.length} recipients.`);
                }
            }

            // WhatsApp Blast Integration
            if (phoneNumbers.length > 0) {
                try {
                    const alertTag = type === "Emergency" || type === "City-wide Alert" ? "🚨 *ALERT*" : "📢 *ANNOUNCEMENT*";
                    const whatsappMessage = `${alertTag}: *${title}*\n\n${message}\n\n- _City Pulse Administration_`;
                    await sendBulkWhatsAppAlert(phoneNumbers, whatsappMessage);
                } catch (whatsappErr) {
                    console.error("Error sending city-wide WhatsApp alerts:", whatsappErr);
                }
            }
        } catch (emailError) {
            console.error("Error sending city-wide alert emails:", emailError);
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
        const workers = await WorkerModel.find({ pushSubscription: { $exists: true } });

        const allUsers = [...citizens, ...admins, ...workers];
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

        const [citizens, admins, workers] = await Promise.all([
            CitizenModel.find({ pushSubscription: { $exists: true } }),
            AdminModel.find({ pushSubscription: { $exists: true } }),
            WorkerModel.find({ pushSubscription: { $exists: true } })
        ]);

        const allUsers = [...citizens, ...admins, ...workers];
        const pushPromises = allUsers.map(u =>
            webpush.sendNotification(u.pushSubscription as any, JSON.stringify({ title, message, type: "Emergency" }))
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
