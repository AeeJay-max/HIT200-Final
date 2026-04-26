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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.markNotificationRead = exports.getNotifications = exports.disasterBroadcast = exports.broadcastNotification = exports.subscribePush = exports.sendTargetedNotification = exports.createNotification = void 0;
const notification_model_1 = require("../models/notification.model");
const citizen_model_1 = require("../models/citizen.model");
const admin_model_1 = require("../models/admin.model");
const worker_model_1 = require("../models/worker.model");
const socket_1 = require("../utils/socket");
const audit_service_1 = require("../services/audit.service");
const email_config_1 = require("../config/email.config");
const whatsapp_service_1 = require("../services/whatsapp.service");
const createNotification = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { title, message, type } = req.body;
        const adminId = req.adminId;
        if (!title || !message || !type) {
            res.status(400).json({ success: false, message: "Missing required fields" });
            return;
        }
        const notification = yield notification_model_1.NotificationModel.create({
            title,
            message,
            type,
            priority: req.body.priority || "Normal",
            linkTo: req.body.linkTo,
            createdBy: adminId,
        });
        // Emit real-time sync event
        const io = (0, socket_1.getIO)();
        io.emit("new_notification", notification);
        // Email integration using Nodemailer
        try {
            const admin = yield admin_model_1.AdminModel.findById(adminId);
            const departmentName = (admin === null || admin === void 0 ? void 0 : admin.role) === "MAIN_ADMIN" ? "City Hall" : ((admin === null || admin === void 0 ? void 0 : admin.department) || "General");
            // User specifically requested citypulse402@gmail.com as the sender
            const smtpUser = "citypulse402@gmail.com";
            const smtpPass = process.env.SMTP_PASS; // We expect the user to provide this in .env
            // Fetch all citizen emails and phone numbers
            const citizens = yield citizen_model_1.CitizenModel.find({}, "email phonenumber");
            const emails = citizens.map(c => c.email).filter(e => e);
            const phoneNumbers = citizens.map(c => c.phonenumber).filter(p => p);
            if (emails.length > 0) {
                if (!smtpPass) {
                    console.log(`[MOCK EMAIL] From: ${smtpUser} | Subject: [${departmentName}] ${title} | To: ${emails.length} citizens`);
                    console.warn("SMTP_PASS is missing in .env. Email not sent.");
                }
                else {
                    // Initialize transporter with citypulse402@gmail.com
                    const transporter = (0, email_config_1.getTransporter)({ user: smtpUser, pass: smtpPass });
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
                    yield transporter.sendMail(mailOptions);
                    console.log(`Successfully sent City-wide Alert from ${smtpUser} to ${emails.length} citizens.`);
                }
            }
            // WhatsApp Blast Integration
            if (phoneNumbers.length > 0) {
                try {
                    const alertTag = type === "Emergency" || type === "City-wide Alert" ? "🚨 *ALERT*" : "📢 *ANNOUNCEMENT*";
                    const whatsappMessage = `${alertTag}: *${title}*\n\n${message}\n\n- _City Pulse Administration_`;
                    yield (0, whatsapp_service_1.sendBulkWhatsAppAlert)(phoneNumbers, whatsappMessage);
                }
                catch (whatsappErr) {
                    console.error("Error sending city-wide WhatsApp alerts:", whatsappErr);
                }
            }
        }
        catch (emailError) {
            console.error("Error sending city-wide alert emails:", emailError);
        }
        res.status(201).json({ success: true, notification });
    }
    catch (error) {
        console.error("Error creating notification:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
});
exports.createNotification = createNotification;
const web_push_1 = __importDefault(require("web-push"));
const vapidKeys = {
    publicKey: "BIhosNvMBwvHorpXnP4Zs5uvTn8RbkqgX7G4bRuPEVeKxbogsy22iNiC4t8to-S6ts8WJ5EjYs_WlN2VBXaJgO0",
    privateKey: "nRXMTyPoHhmmChyNzL1Ps2ObXOC2U48zRUwBG4qM_Yc"
};
web_push_1.default.setVapidDetails("mailto:citypulsead@gmail.com", vapidKeys.publicKey, vapidKeys.privateKey);
const sendTargetedNotification = (userId, title, message, type) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const notification = yield notification_model_1.NotificationModel.create({
            title,
            message,
            type,
            recipientId: userId,
            priority: "High",
        });
        const io = (0, socket_1.getIO)();
        io.to(userId).emit("new_notification", notification);
        // Attempt Web Push if subscription exists
        const user = (yield citizen_model_1.CitizenModel.findById(userId)) || (yield admin_model_1.AdminModel.findById(userId)) || (yield worker_model_1.WorkerModel.findById(userId));
        if (user === null || user === void 0 ? void 0 : user.pushSubscription) {
            yield web_push_1.default.sendNotification(user.pushSubscription, JSON.stringify({ title, message, type }));
        }
        console.log(`[Targeted Notification] To: ${userId} | Title: ${title}`);
    }
    catch (error) {
        console.error("Error sending targeted notification:", error);
    }
});
exports.sendTargetedNotification = sendTargetedNotification;
const subscribePush = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { subscription } = req.body;
        const userId = req.citizenId || req.adminId || req.workerId;
        const Model = req.citizenId ? citizen_model_1.CitizenModel : req.adminId ? admin_model_1.AdminModel : worker_model_1.WorkerModel;
        yield Model.findByIdAndUpdate(userId, { pushSubscription: subscription });
        res.status(200).json({ success: true, message: "Subscribed to push notifications" });
    }
    catch (error) {
        res.status(500).json({ success: false, message: "Subscription failed" });
    }
});
exports.subscribePush = subscribePush;
const broadcastNotification = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { title, message, type, department } = req.body;
        const adminId = req.adminId;
        const notification = yield notification_model_1.NotificationModel.create({
            title,
            message,
            type: type || "Broadcast",
            createdBy: adminId,
            priority: "Critical",
            deliveryStatus: "pending"
        });
        const io = (0, socket_1.getIO)();
        io.emit("new_notification", notification);
        // Batch send push notifications to all users with subscriptions
        const citizens = yield citizen_model_1.CitizenModel.find({ pushSubscription: { $exists: true } });
        const admins = yield admin_model_1.AdminModel.find({ pushSubscription: { $exists: true } });
        const allUsers = [...citizens, ...admins];
        const pushPromises = allUsers.map(u => web_push_1.default.sendNotification(u.pushSubscription, JSON.stringify({ title, message, type: "Broadcast" }))
            .catch(err => console.error("Push failed for user", u._id)));
        const pushResults = yield Promise.allSettled(pushPromises);
        const failedCount = pushResults.filter(r => r.status === "rejected").length;
        notification.deliveryStatus = failedCount > 0 ? "failed" : "sent";
        yield notification.save();
        yield (0, audit_service_1.logAction)({
            actorId: adminId,
            actorRole: "ADMIN",
            actionType: "BROADCAST_SENT",
            targetEntity: "NOTIFICATION",
            targetId: notification._id,
            newValue: { title, type: "Broadcast" },
            ipAddress: req.ip
        });
        res.status(201).json({ success: true, notification });
    }
    catch (error) {
        res.status(500).json({ success: false, message: "Broadcast failed" });
    }
});
exports.broadcastNotification = broadcastNotification;
const disasterBroadcast = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { title, message } = req.body;
        const adminId = req.adminId;
        const notification = yield notification_model_1.NotificationModel.create({
            title: `🚨 EMERGENCY: ${title}`,
            message,
            type: "Emergency",
            priority: "Critical",
            createdBy: adminId,
            deliveryStatus: "pending"
        });
        const citizens = yield citizen_model_1.CitizenModel.find({ pushSubscription: { $exists: true } });
        const pushPromises = citizens.map(c => web_push_1.default.sendNotification(c.pushSubscription, JSON.stringify({ title, message, type: "Emergency" })));
        yield Promise.allSettled(pushPromises);
        notification.deliveryStatus = "sent";
        yield notification.save();
        res.status(200).json({ success: true, message: "Disaster broadcast sent to all" });
    }
    catch (error) {
        res.status(500).json({ success: false, message: "Failed" });
    }
});
exports.disasterBroadcast = disasterBroadcast;
const getNotifications = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.citizenId || req.adminId || req.workerId;
        const { type } = req.query;
        const query = {
            $or: [
                { recipientId: userId },
                { type: "Broadcast" }
            ]
        };
        if (type && type !== "All")
            query.type = type;
        const notifications = yield notification_model_1.NotificationModel.find(query).sort({ createdAt: -1 });
        const unread = notifications.filter(n => !n.isRead);
        const read = notifications.filter(n => n.isRead);
        const priority = notifications.filter(n => n.priority === "Critical" || n.priority === "Urgent");
        res.status(200).json({ success: true, unread, read, priority });
    }
    catch (error) {
        res.status(500).json({ success: false, message: "Fetch failed" });
    }
});
exports.getNotifications = getNotifications;
const markNotificationRead = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        yield notification_model_1.NotificationModel.findByIdAndUpdate(id, { isRead: true });
        res.status(200).json({ success: true });
    }
    catch (error) {
        res.status(500).json({ success: false, message: "Update failed" });
    }
});
exports.markNotificationRead = markNotificationRead;
