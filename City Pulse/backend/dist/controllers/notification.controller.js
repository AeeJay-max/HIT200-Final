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
exports.getNotifications = exports.createNotification = void 0;
const notification_model_1 = require("../models/notification.model");
const citizen_model_1 = require("../models/citizen.model");
const admin_model_1 = require("../models/admin.model");
const nodemailer_1 = __importDefault(require("nodemailer"));
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
            createdBy: adminId,
        });
        // Email integration using Nodemailer
        try {
            // Determine sender email based on the Admin's department
            const admin = yield admin_model_1.AdminModel.findById(adminId);
            const department = (admin === null || admin === void 0 ? void 0 : admin.department) || "Main";
            let smtpUser = process.env.SMTP_USER;
            let smtpPass = process.env.SMTP_PASS;
            if (department === "Main") {
                smtpUser = process.env.SMTP_USER_MAIN || "citypulseadmin@gmail.com";
                smtpPass = process.env.SMTP_PASS_MAIN;
            }
            else if (department === "Roads") {
                smtpUser = process.env.SMTP_USER_ROADS;
                smtpPass = process.env.SMTP_PASS_ROADS;
            }
            else if (department === "Water") {
                smtpUser = process.env.SMTP_USER_WATER;
                smtpPass = process.env.SMTP_PASS_WATER;
            }
            else if (department === "Environment") {
                smtpUser = process.env.SMTP_USER_ENVIRONMENT;
                smtpPass = process.env.SMTP_PASS_ENVIRONMENT;
            }
            // Fallback to default if specific department credentials are not provided
            smtpUser = smtpUser || process.env.SMTP_USER || "citypulseadmin@gmail.com";
            smtpPass = smtpPass || process.env.SMTP_PASS;
            // Fetch all citizen emails
            const citizens = yield citizen_model_1.CitizenModel.find({}, "email");
            const emails = citizens.map(c => c.email).filter(e => e);
            if (emails.length > 0) {
                if (!smtpUser || !smtpPass) {
                    console.log(`[MOCK EMAIL] From: ${department} (${smtpUser}) | To: ${emails.length} citizens | Title: ${title} | Message: ${message}`);
                }
                else {
                    // Initialize dynamic transporter for this specific department
                    const transporter = nodemailer_1.default.createTransport({
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
                    yield transporter.sendMail(mailOptions);
                    console.log(`Successfully sent email alert from ${smtpUser} to ${emails.length} citizens.`);
                }
            }
            else {
                console.log("No citizens found to email.");
            }
        }
        catch (emailError) {
            console.error("Error sending emails:", emailError);
            // Don't fail the request if email sending fails
        }
        res.status(201).json({ success: true, notification });
    }
    catch (error) {
        console.error("Error creating notification:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
});
exports.createNotification = createNotification;
const getNotifications = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const notifications = yield notification_model_1.NotificationModel.find().sort({ createdAt: -1 }).limit(50);
        res.status(200).json({ success: true, notifications });
    }
    catch (error) {
        console.error("Error fetching notifications:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
});
exports.getNotifications = getNotifications;
