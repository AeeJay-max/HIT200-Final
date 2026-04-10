import { Request, Response } from "express";
import { NotificationModel } from "../models/notification.model";
import { CitizenModel } from "../models/citizen.model";
import { AdminModel } from "../models/admin.model";
import nodemailer from "nodemailer";

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
            createdBy: adminId,
        });

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
                    const transporter = nodemailer.createTransport({
                        host: process.env.SMTP_HOST || "smtp.gmail.com",
                        port: parseInt(process.env.SMTP_PORT || "587"),
                        secure: false,
                        auth: {
                            user: smtpUser,
                            pass: smtpPass,
                        },
                    });

                    const mailOptions = {
                        from: `"CityPulse ${department} Alerts" <${smtpUser}>`,
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

export const getNotifications = async (req: Request, res: Response): Promise<void> => {
    try {
        const citizenId = (req as any).citizenId;
        const adminId = (req as any).adminId;
        const userId = citizenId || adminId;

        let query: any = {};
        if (citizenId) {
            query = { $or: [{ recipient: citizenId }, { recipient: { $exists: false } }, { recipient: null }] };
        } else if (adminId) {
            query = { $or: [{ createdBy: adminId }, { recipient: null }] };
        }

        const notifications = await NotificationModel.find(query).sort({ createdAt: -1 }).limit(50);

        const mapped = notifications.map(n => {
            const obj = n.toObject();
            const isRead = n.readBy && n.readBy.some(id => id.toString() === userId?.toString());
            return { ...obj, isRead };
        });

        res.status(200).json({ success: true, notifications: mapped });
    } catch (error) {
        console.error("Error fetching notifications:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

export const getUnreadCount = async (req: Request, res: Response): Promise<void> => {
    try {
        const citizenId = (req as any).citizenId;
        if (!citizenId) { res.status(200).json({ count: 0 }); return; }

        const query = { $or: [{ recipient: citizenId }, { recipient: { $exists: false } }, { recipient: null }] };
        const notifications = await NotificationModel.find(query);
        const unreadCount = notifications.filter(n => !n.readBy || !n.readBy.some(id => id.toString() === citizenId.toString())).length;

        res.status(200).json({ success: true, count: unreadCount });
    } catch (error) {
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

export const markAsRead = async (req: Request, res: Response): Promise<void> => {
    try {
        const citizenId = (req as any).citizenId;
        const adminId = (req as any).adminId;
        const userId = citizenId || adminId;

        const { id } = req.params;
        const notification = await NotificationModel.findById(id);
        if (!notification) { res.status(404).json({ message: "Not found" }); return; }

        if (!notification.readBy) notification.readBy = [];
        if (!notification.readBy.includes(userId)) {
            notification.readBy.push(userId);
            await notification.save();
        }

        res.status(200).json({ success: true });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};

import webpush from "web-push";

webpush.setVapidDetails(
    process.env.VAPID_MAILTO || "mailto:test@example.com",
    process.env.VAPID_PUBLIC_KEY || "YOUR_PUBLIC_KEY",
    process.env.VAPID_PRIVATE_KEY || "YOUR_PRIVATE_KEY"
);

export const subscribeToPush = async (req: Request, res: Response): Promise<void> => {
    try {
        const citizenId = (req as any).citizenId;
        const subscription = req.body;
        await CitizenModel.findByIdAndUpdate(citizenId, { pushSubscription: subscription });
        res.status(200).json({ success: true, message: "Subscribed to push notifications" });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};

export const sendBroadcast = async (req: Request, res: Response): Promise<void> => {
    try {
        const { title, message } = req.body;
        const adminId = (req as any).adminId;

        await NotificationModel.create({
            title,
            message,
            type: "broadcast",
            createdBy: adminId
        });

        const citizens = await CitizenModel.find({ pushSubscription: { $ne: null } });

        const payload = JSON.stringify({ title, body: message });

        const promises = citizens.map(c =>
            webpush.sendNotification(c.pushSubscription as any, payload).catch((e: any) => console.log("Push Error:", e))
        );

        await Promise.all(promises);

        res.status(200).json({ success: true, message: "Broadcast sent" });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};
